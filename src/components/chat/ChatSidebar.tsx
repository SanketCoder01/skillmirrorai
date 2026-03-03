// =====================================================
// CHAT SIDEBAR - Left panel (30%) with chat list
// =====================================================

import { useState } from 'react';
import { Search, MoreVertical, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Circle } from 'lucide-react';
import { Conversation } from './types';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  loading?: boolean;
}

export const ChatSidebar = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
}: ChatSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participantSubtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participantSkillmirrorId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
    }
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className="w-[30%] min-w-[300px] max-w-[400px] flex flex-col bg-[#111b21] border-r border-[#222d34]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#202c33]">
        <h2 className="text-lg font-semibold text-[#e9edef]">Chats</h2>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <Badge className="rounded-full bg-[#00a884] text-white text-xs px-2">
              {totalUnread}
            </Badge>
          )}
          <button className="p-2 hover:bg-[#2a3942] rounded-full transition-colors">
            <MoreVertical className="h-5 w-5 text-[#8696a0]" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 bg-[#111b21]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8696a0]" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-2 bg-[#202c33] border-none text-[#e9edef] placeholder:text-[#8696a0] rounded-lg focus:ring-0 focus:ring-offset-0"
          />
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00a884] border-t-transparent" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#8696a0]">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#222d34]/50 ${
                selectedConversationId === conv._id
                  ? 'bg-[#2a3942]'
                  : 'hover:bg-[#202c33]'
              }`}
            >
              {/* Avatar with online indicator */}
              <div className="relative shrink-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.participantAvatar || undefined} />
                  <AvatarFallback className="bg-[#00a884] text-white font-medium">
                    {conv.participantName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {conv.isOnline && (
                  <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-[#00a884] text-[#00a884] stroke-[#111b21] stroke-[2]" />
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#e9edef] truncate">
                    {conv.participantName}
                  </p>
                  <span className="text-xs text-[#8696a0] shrink-0 ml-2">
                    {formatDate(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-sm text-[#8696a0] truncate">
                    {conv.lastMessage}
                  </p>
                  {conv.unreadCount > 0 && (
                    <Badge className="rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px] bg-[#00a884] text-white ml-2">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
};
