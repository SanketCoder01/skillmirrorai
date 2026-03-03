// =====================================================
// REAL-TIME CHAT HOOK - Supabase Realtime subscriptions
// Transforms snake_case DB fields to camelCase Message type
// =====================================================

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/components/chat/types';

// Raw database message type (snake_case)
interface DbMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  status: 'sent' | 'delivered' | 'seen';
  created_at: string;
  delivered_at: string | null;
  seen_at: string | null;
  conversation_id: string | null;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
  updated_at: string;
}

interface UseChatSocketOptions {
  userId: string | undefined;
  selectedParticipantId: string | null;
  onNewMessage: (message: DbMessage) => void; // Raw DB message
  onMessageUpdate: (message: DbMessage) => void; // Raw DB message
  onRefreshConversations: () => void;
}

export const useChatSocket = ({
  userId,
  selectedParticipantId,
  onNewMessage,
  onMessageUpdate,
  onRefreshConversations,
}: UseChatSocketOptions) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Clean up existing channels
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];

    // Messages channel - INSERT events
    const messagesChannel = supabase
      .channel(`chat-messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          
          // Only process if message involves current user
          if (newMsg.sender_id === userId || newMsg.receiver_id === userId) {
            // Check if this message belongs to current conversation
            if (selectedParticipantId && 
                (newMsg.sender_id === selectedParticipantId || 
                 newMsg.receiver_id === selectedParticipantId)) {
              onNewMessage(newMsg);
            }
            // Always refresh conversations list
            onRefreshConversations();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMsg = payload.new as DbMessage;
          if (updatedMsg.sender_id === userId || updatedMsg.receiver_id === userId) {
            onMessageUpdate(updatedMsg);
          }
        }
      )
      .subscribe();

    // Presence channel
    const presenceChannel = supabase
      .channel(`chat-presence-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          onRefreshConversations();
        }
      )
      .subscribe();

    channelsRef.current = [messagesChannel, presenceChannel];

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId, selectedParticipantId, onNewMessage, onMessageUpdate, onRefreshConversations]);

  // Setup user presence (online status)
  const setupPresence = useCallback(async () => {
    if (!userId) return;

    await supabase
      .from('user_presence')
      .upsert({
        user_id: userId,
        is_online: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Set offline on page unload
    const handleUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${userId}`,
        JSON.stringify({
          is_online: false,
          last_seen_at: new Date().toISOString(),
        })
      );
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [userId]);

  return { setupPresence };
};

// Type for RealtimeChannel
type RealtimeChannel = ReturnType<typeof supabase.channel>;
