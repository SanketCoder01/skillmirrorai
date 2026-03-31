// =====================================================
// STUDENT INBOX - WhatsApp Web-style messaging UI
// Two-panel layout: 30% sidebar, 70% chat window
// STRICT ALIGNMENT: senderId === currentUser._id → RIGHT
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { Message, Conversation } from '@/components/chat/types';
import { useChatSocket } from '@/hooks/useChatSocket';

const StudentInbox = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH CONVERSATIONS - Transform to new types
  // =====================================================
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, Conversation>();

      for (const msg of messagesData || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;

        if (!conversationMap.has(partnerId)) {
          // Fetch partner details (recruiter for student inbox)
          const { data: partner } = await supabase
            .from('recruiters')
            .select('full_name, company, avatar_url, position')
            .eq('user_id', partnerId)
            .maybeSingle();

          // Fetch SK ID from profiles
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('skillmirror_id')
            .eq('user_id', partnerId)
            .maybeSingle();

          // Check online status
          const { data: presence } = await supabase
            .from('user_presence')
            .select('is_online')
            .eq('user_id', partnerId)
            .maybeSingle();

          // Count unread
          const unreadCount = messagesData?.filter(
            m => m.sender_id === partnerId && m.receiver_id === user.id && m.status !== 'seen'
          ).length || 0;

          // Transform to Conversation type with camelCase
          conversationMap.set(partnerId, {
            _id: partnerId,
            participantId: partnerId,
            participantName: partner?.full_name || 'Recruiter',
            participantAvatar: partner?.avatar_url || null,
            participantSubtitle: partner?.company || null,
            participantSkillmirrorId: partnerProfile?.skillmirror_id || null,
            lastMessage: msg.content,
            lastMessageAt: msg.created_at,
            unreadCount: unreadCount,
            isOnline: presence?.is_online || false,
          });
        }
      }

      // Sort by latest message
      const sorted = Array.from(conversationMap.values()).sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
      setConversations(sorted);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // =====================================================
  // FETCH MESSAGES - Transform to Message type
  // =====================================================
  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter out deleted messages
      const visibleMessages = (data || []).filter(
        m => !(m.deleted_by_sender && m.sender_id === user.id) &&
             !(m.deleted_by_receiver && m.receiver_id === user.id)
      );

      // Transform to Message type with camelCase
      setMessages(visibleMessages.map(m => ({
        _id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        content: m.content,
        attachmentUrl: m.attachment_url,
        attachmentName: m.attachment_name,
        attachmentType: m.attachment_type,
        status: (m.status || 'sent') as 'sent' | 'delivered' | 'seen',
        createdAt: m.created_at,
        deliveredAt: m.delivered_at,
        seenAt: m.seen_at,
      })));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [user]);

  // =====================================================
  // SEND MESSAGE - Save to database
  // =====================================================
  const sendMessage = useCallback(async (
    content: string,
    attachment?: { url: string; name: string; type: string } | null
  ) => {
    if (!user || !selectedConversation) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedConversation.participantId,
      content,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
      attachment_type: attachment?.type || null,
      status: 'sent',
    });

    if (error) throw error;

    // Update conversation list immediately (WhatsApp behavior)
    setConversations(prev => {
      const next = prev.map(c => {
        if (c.participantId !== selectedConversation.participantId) return c;
        return {
          ...c,
          lastMessage: content || (attachment ? `📎 ${attachment.name}` : c.lastMessage),
          lastMessageAt: new Date().toISOString(),
        };
      });
      next.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      return next;
    });

    // Refresh messages
    fetchMessages(selectedConversation.participantId);
  }, [user, selectedConversation, fetchMessages]);

  // =====================================================
  // MARK AS SEEN - Update message status
  // =====================================================
  const markAsSeen = useCallback(async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ status: 'seen', seen_at: new Date().toISOString() })
      .eq('id', messageId);
  }, []);

  // =====================================================
  // DELETE CHAT - Soft delete messages for current user
  // =====================================================
  const deleteChat = useCallback(async (participantId: string) => {
    if (!user) return;

    // Mark sent messages as deleted by sender
    await supabase
      .from('messages')
      .update({ deleted_by_sender: true })
      .eq('sender_id', user.id)
      .eq('receiver_id', participantId);
    
    // Mark received messages as deleted by receiver
    await supabase
      .from('messages')
      .update({ deleted_by_receiver: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', participantId);

    // Remove conversation from list
    setConversations(prev => prev.filter(c => c.participantId !== participantId));
    setSelectedConversation(null);
    setMessages([]);
  }, [user]);

  // =====================================================
  // REAL-TIME SOCKET - Handle new messages
  // =====================================================
  const { setupPresence } = useChatSocket({
    userId: user?.id,
    selectedParticipantId: selectedConversation?.participantId || null,
    onNewMessage: (msg) => {
      // Transform incoming message to Message type
      const newMsg: Message = {
        _id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        attachmentUrl: msg.attachment_url,
        attachmentName: msg.attachment_name,
        attachmentType: msg.attachment_type,
        status: (msg.status || 'sent') as 'sent' | 'delivered' | 'seen',
        createdAt: msg.created_at,
        deliveredAt: msg.delivered_at,
        seenAt: msg.seen_at,
      };
      
      setMessages(prev => {
        if (prev.some(m => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    },
    onMessageUpdate: (msg) => {
      setMessages(prev => prev.map(m => m._id === msg.id ? {
        ...m,
        status: (msg.status || m.status) as 'sent' | 'delivered' | 'seen',
        deliveredAt: msg.delivered_at,
        seenAt: msg.seen_at,
      } : m));
    },
    onRefreshConversations: fetchConversations,
  });

  // Initial load
  useEffect(() => {
    if (!user) return;
    fetchConversations();
    setupPresence();
  }, [user, fetchConversations, setupPresence]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participantId);
    }
  }, [selectedConversation, fetchMessages]);

  return (
    <div className="h-[calc(100vh-120px)] flex overflow-hidden rounded-lg border border-[#222d34] bg-[#111b21]">
      {/* Left Panel: 30% - Chat List */}
      <ChatSidebar
        conversations={conversations}
        selectedConversationId={selectedConversation?._id || null}
        onSelectConversation={setSelectedConversation}
        loading={loading}
      />
      {/* Right Panel: 70% - Chat Window */}
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        currentUserId={user?.id || ''}
        currentUserRole="student"
        onSendMessage={sendMessage}
        onMarkAsSeen={markAsSeen}
        onDeleteChat={deleteChat}
      />
    </div>
  );
};

export default StudentInbox;
