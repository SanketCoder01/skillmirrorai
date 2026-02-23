import { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Send, Loader2, ArrowLeft, User, GraduationCap,
  Search, Check, CheckCheck
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
  participant_university: string | null;
  participant_skillmirror_id: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

const RecruiterInbox = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('recruiter-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          if (selectedConversation && 
              (newMsg.sender_id === selectedConversation.participant_id || 
               newMsg.receiver_id === selectedConversation.participant_id)) {
            setMessages(prev => [...prev, newMsg]);
          }
          
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.participant_id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, Conversation>();

      for (const msg of messagesData || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          const { data: partner } = await supabase
            .from("students")
            .select("full_name, avatar_url, university, skillmirror_id")
            .eq("user_id", partnerId)
            .maybeSingle();

          const unreadCount = messagesData?.filter(
            m => m.sender_id === partnerId && m.receiver_id === user.id && !m.read_at
          ).length || 0;

          conversationMap.set(partnerId, {
            id: partnerId,
            participant_id: partnerId,
            participant_name: partner?.full_name || "Student",
            participant_avatar: partner?.avatar_url || null,
            participant_university: partner?.university || null,
            participant_skillmirror_id: partner?.skillmirror_id || null,
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

      const unreadMessages = data?.filter(
        m => m.receiver_id === user.id && !m.read_at
      ) || [];

      for (const msg of unreadMessages) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("id", msg.id);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
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
    c.participant_university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant_skillmirror_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Conversations List */}
      <Card className={`w-full md:w-80 flex-shrink-0 ${selectedConversation ? 'hidden md:block' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
            {conversations.filter(c => c.unread_count > 0).length > 0 && (
              <Badge variant="default" className="rounded-full">
                {conversations.filter(c => c.unread_count > 0).length}
              </Badge>
            )}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, university, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-350px)]">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-xs mt-1">Message students from their profile</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b ${
                    selectedConversation?.id === conv.id ? 'bg-muted/50' : ''
                  }`}
                >
                  <Avatar>
                    <AvatarImage src={conv.participant_avatar || undefined} />
                    <AvatarFallback>
                      {conv.participant_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{conv.participant_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.participant_skillmirror_id || conv.participant_university}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.last_message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat View */}
      <Card className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
        {selectedConversation ? (
          <>
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
                    <GraduationCap className="h-3 w-3" />
                    {selectedConversation.participant_university} • {selectedConversation.participant_skillmirror_id}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[calc(100vh-380px)] p-4">
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
            <p className="text-sm">Or message a student from their profile</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecruiterInbox;
