import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MessageSquare, Send, Loader2, ArrowLeft, User, Building2,
  Search, MoreVertical, Check, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_avatar: string | null;
  participant_company: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const StudentInbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // If we're viewing this conversation, add the message
          if (selectedConversation && 
              (newMsg.sender_id === selectedConversation.participant_id || 
               newMsg.receiver_id === selectedConversation.participant_id)) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if we're the receiver
            if (newMsg.receiver_id === user.id && !newMsg.read_at) {
              markMessageAsRead(newMsg.id);
            }
          }
          
          // Update conversations list
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participant_id);
    }
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all messages involving this user
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messagesData || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          // Fetch partner details
          const { data: partner } = await supabase
            .from("recruiters")
            .select("full_name, company, avatar_url")
            .eq("user_id", partnerId)
            .maybeSingle();

          // Count unread messages
          const unreadCount = messagesData?.filter(
            m => m.sender_id === partnerId && m.receiver_id === user.id && !m.read_at
          ).length || 0;

          conversationMap.set(partnerId, {
            id: partnerId,
            participant_id: partnerId,
            participant_name: partner?.full_name || "Recruiter",
            participant_avatar: partner?.avatar_url || null,
            participant_company: partner?.company || null,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: unreadCount
          });
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (partnerId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages = data?.filter(
        m => m.receiver_id === user.id && !m.read_at
      ) || [];

      for (const msg of unreadMessages) {
        await markMessageAsRead(msg.id);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.participant_id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        Inbox
        {conversations.filter(c => c.unread_count > 0).length > 0 && (
          <Badge variant="default" className="rounded-full ml-2">
            {conversations.filter(c => c.unread_count > 0).length} unread
          </Badge>
        )}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
        {/* Conversations List */}
        <Card className={`md:col-span-1 flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">Recruiters will message you here</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                      selectedConversation?.id === conv.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conv.participant_avatar || undefined} />
                      <AvatarFallback>
                        {conv.participant_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate text-sm">{conv.participant_name}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.participant_company}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {conv.last_message}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge variant="default" className="rounded-full h-4 w-4 p-0 flex items-center justify-center text-[10px] ml-2">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className={`md:col-span-2 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.participant_avatar || undefined} />
                    <AvatarFallback>
                      {selectedConversation.participant_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.participant_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {selectedConversation.participant_company}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                      <p>Start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex mb-3 ${
                          msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className="text-xs opacity-70">
                              {formatTime(msg.created_at)}
                            </span>
                            {msg.sender_id === user?.id && (
                              msg.read_at ? (
                                <CheckCheck className="h-3 w-3 opacity-70" />
                              ) : (
                                <Check className="h-3 w-3 opacity-70" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from your existing conversations</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentInbox;
