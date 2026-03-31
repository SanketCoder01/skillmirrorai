// =====================================================
// CHAT WINDOW - Right panel (70%) with messages
// STRICT ALIGNMENT: senderId === currentUser._id → RIGHT
// =====================================================

import { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, File, X, MoreVertical, 
  Circle, ExternalLink, Mail, Building2, 
  GraduationCap, Briefcase, Globe, Link2, Loader2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Message, Conversation, StudentProfile, RecruiterProfile } from './types';
import { MessageBubble } from './MessageBubble';
import { supabase } from '@/integrations/supabase/client';

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string; // logged-in user's _id
  currentUserRole: 'student' | 'recruiter';
  onSendMessage: (content: string, attachment?: { url: string; name: string; type: string } | null) => Promise<void>;
  onMarkAsSeen: (messageId: string) => Promise<void>;
  onDeleteChat: (participantId: string) => Promise<void>;
}

export const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  currentUserRole,
  onSendMessage,
  onMarkAsSeen,
  onDeleteChat,
}: ChatWindowProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfile | RecruiterProfile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // =====================================================
  // AUTO-SCROLL: Scroll to bottom on new messages
  // =====================================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // =====================================================
  // MARK AS SEEN: When viewing messages
  // =====================================================
  useEffect(() => {
    if (!conversation) return;
    
    messages.forEach((msg) => {
      if (msg.receiverId === currentUserId && msg.status !== 'seen') {
        onMarkAsSeen(msg._id);
      }
    });
  }, [conversation, messages, currentUserId, onMarkAsSeen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachmentFile) || sending) return;

    setSending(true);
    try {
      let attachment = null;
      
      if (attachmentFile) {
        const uploaded = await uploadAttachment(attachmentFile);
        if (uploaded) {
          attachment = uploaded;
        }
      }

      await onSendMessage(newMessage.trim(), attachment);
      setNewMessage('');
      setAttachmentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const uploadAttachment = async (file: File) => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      return { url: publicUrl, name: file.name, type: file.type };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  };

  // =====================================================
  // FETCH PROFILE: Different data for student vs recruiter
  // =====================================================
  const fetchProfileData = async (participantId: string) => {
    try {
      if (currentUserRole === 'recruiter') {
        // Recruiter viewing student profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, avatar_url, skillmirror_id, university, course, resume_url, linkedin_url')
          .eq('user_id', participantId)
          .maybeSingle();

        if (profile) {
          setProfileData({
            _id: profile.user_id,
            fullName: profile.full_name || 'Student',
            email: profile.email || '',
            avatar: profile.avatar_url,
            skillmirrorId: profile.skillmirror_id,
            university: profile.university,
            course: profile.course,
            resumeUrl: profile.resume_url,
            linkedinUrl: profile.linkedin_url,
          } as StudentProfile);
        }
      } else {
        // Student viewing recruiter profile
        const { data: recruiter } = await supabase
          .from('recruiters')
          .select('user_id, full_name, email, avatar_url, position, company, company_website')
          .eq('user_id', participantId)
          .maybeSingle();

        const { data: profile } = await supabase
          .from('profiles')
          .select('skillmirror_id')
          .eq('user_id', participantId)
          .maybeSingle();

        if (recruiter) {
          setProfileData({
            _id: recruiter.user_id,
            fullName: recruiter.full_name || 'Recruiter',
            email: recruiter.email || '',
            avatar: recruiter.avatar_url,
            skillmirrorId: profile?.skillmirror_id || null,
            designation: recruiter.position,
            companyName: recruiter.company,
            companyWebsite: recruiter.company_website,
          } as RecruiterProfile);
        }
      }
      setShowProfileSheet(true);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Empty state - no conversation selected
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b141a] text-[#8696a0]">
        <div className="w-64 h-64 rounded-full bg-[#00a884]/10 flex items-center justify-center mb-6">
          <svg className="w-32 h-32 text-[#00a884]/30" viewBox="0 0 303 172" fill="currentColor">
            <path d="M229.565 160.229c32.647-16.166 54.688-48.609 57.586-86.313.855-11.116-6.988-20.984-18.104-21.84-11.116-.855-20.984 6.988-21.84 18.104-2.086 27.095-17.873 50.018-40.218 61.064-9.915 4.909-14.118 16.613-9.208 26.528 4.909 9.915 16.613 14.118 26.528 9.208l5.256-6.751zm-156.13 0c-32.647-16.166-54.688-48.609-57.586-86.313-.855-11.116 6.988-20.984 18.104-21.84 11.116-.855 20.984 6.988 21.84 18.104 2.086 27.095 17.873 50.018 40.218 61.064 9.915 4.909 14.118 16.613 9.208 26.528-4.909 9.915-16.613 14.118-26.528 9.208l-5.256-6.751z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-light text-[#e9edef] mb-2">SkillMirror Web</h2>
        <p className="text-sm text-center max-w-xs">
          Send and receive messages. Select a conversation to start chatting.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0b141a]">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#202c33] border-b border-[#222d34]">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:bg-[#2a3942] p-2 rounded-lg transition-colors flex-1"
          onClick={() => fetchProfileData(conversation.participantId)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversation.participantAvatar || undefined} />
              <AvatarFallback className="bg-[#00a884] text-white">
                {conversation.participantName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {conversation.isOnline && (
              <Circle className="absolute bottom-0 right-0 h-2.5 w-2.5 fill-[#00a884] text-[#00a884] stroke-[#202c33] stroke-[2]" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-[#e9edef]">{conversation.participantName}</p>
            <p className="text-xs text-[#8696a0]">
              {conversation.isOnline 
                ? 'Online' 
                : conversation.participantSkillmirrorId || conversation.participantSubtitle
              }
            </p>
          </div>
        </div>
        {/* 3-dot Menu with Delete Option */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#202c33] border-[#222d34]">
            <DropdownMenuItem 
              onClick={() => fetchProfileData(conversation.participantId)}
              className="text-[#e9edef] hover:bg-[#2a3942] cursor-pointer"
            >
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-400 hover:bg-[#2a3942] cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Encryption Banner */}
      <div className="px-4 py-1.5 bg-[#202c33] text-center">
        <p className="text-xs text-[#8696a0]">
          🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
        </p>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-2"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23111111' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#0b141a',
        }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-0.5">
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showDate = idx === 0 || 
                formatDate(msg.createdAt) !== formatDate(prevMsg?.createdAt);

              return (
                <MessageBubble
                  key={msg._id} // unique _id as key
                  message={msg}
                  currentUserId={currentUserId} // passed for alignment comparison
                  showDate={showDate}
                  dateText={showDate ? formatDate(msg.createdAt) : undefined}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="px-4 py-3 bg-[#202c33] border-t border-[#222d34]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {attachmentFile && (
            <div className="flex items-center gap-1 bg-[#2a3942] px-2 py-1 rounded-lg text-xs text-[#8696a0]">
              <File className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{attachmentFile.name}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  setAttachmentFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <Input
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-[#2a3942] border-none text-[#e9edef] placeholder:text-[#8696a0] rounded-lg px-4 py-2 focus:ring-0 focus:ring-offset-0"
          />

          <Button 
            type="submit" 
            disabled={sending || (!newMessage.trim() && !attachmentFile)} 
            size="icon"
            className="rounded-full bg-[#00a884] hover:bg-[#008f72] shrink-0 text-white"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Profile Sheet - Different content based on role */}
      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent className="w-[400px] bg-[#111b21] border-[#222d34] text-[#e9edef]">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2 text-[#e9edef]">
              Contact Info
            </SheetTitle>
          </SheetHeader>
          
          {profileData && (
            <div className="space-y-6">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src={profileData.avatar || undefined} />
                  <AvatarFallback className="bg-[#00a884] text-white text-2xl">
                    {profileData.fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold">{profileData.fullName}</h3>
                {profileData.skillmirrorId && (
                  <p className="text-sm font-mono text-[#00a884]">{profileData.skillmirrorId}</p>
                )}
              </div>

              {/* Student Profile Fields */}
              {'university' in profileData && (
                <div className="space-y-4">
                  {profileData.university && (
                    <div className="flex items-center gap-3 text-sm">
                      <GraduationCap className="h-4 w-4 text-[#8696a0]" />
                      <span>{profileData.university}</span>
                    </div>
                  )}
                  {profileData.course && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-[#8696a0]" />
                      <span>{profileData.course}</span>
                    </div>
                  )}
                  {profileData.email && (
                    <a 
                      href={`mailto:${profileData.email}`}
                      className="flex items-center gap-3 text-sm hover:text-[#00a884] transition-colors"
                    >
                      <Mail className="h-4 w-4 text-[#8696a0]" />
                      <span>{profileData.email}</span>
                    </a>
                  )}
                  {profileData.resumeUrl && (
                    <a 
                      href={profileData.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-[#00a884] transition-colors"
                    >
                      <File className="h-4 w-4 text-[#8696a0]" />
                      <span>View Resume</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {profileData.linkedinUrl && (
                    <a 
                      href={profileData.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-[#00a884] transition-colors"
                    >
                      <Link2 className="h-4 w-4 text-[#8696a0]" />
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Recruiter Profile Fields */}
              {'companyName' in profileData && (
                <div className="space-y-4">
                  {profileData.designation && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="h-4 w-4 text-[#8696a0]" />
                      <span>{profileData.designation}</span>
                    </div>
                  )}
                  {profileData.companyName && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="h-4 w-4 text-[#8696a0]" />
                      <span>{profileData.companyName}</span>
                    </div>
                  )}
                  {profileData.companyWebsite && (
                    <a 
                      href={profileData.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-[#00a884] transition-colors"
                    >
                      <Globe className="h-4 w-4 text-[#8696a0]" />
                      <span>Company Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {profileData.email && (
                    <a 
                      href={`mailto:${profileData.email}`}
                      className="flex items-center gap-3 text-sm hover:text-[#00a884] transition-colors"
                    >
                      <Mail className="h-4 w-4 text-[#8696a0]" />
                      <span>{profileData.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Delete Chat Button in Profile Sheet */}
          <div className="pt-6 border-t border-[#222d34]">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-400 hover:bg-red-400/10 hover:text-red-400"
              onClick={() => {
                setShowProfileSheet(false);
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Chat
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#202c33] border-[#222d34] text-[#e9edef]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#8696a0]">
              This will delete the chat from your device. The other person will still have a copy. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#222d34] text-[#e9edef] hover:bg-[#2a3942]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleting}
              onClick={async () => {
                if (!conversation) return;
                setDeleting(true);
                try {
                  await onDeleteChat(conversation.participantId);
                  setShowDeleteDialog(false);
                } catch (error) {
                  console.error('Error deleting chat:', error);
                } finally {
                  setDeleting(false);
                }
              }}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
