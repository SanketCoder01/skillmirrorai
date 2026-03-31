// =====================================================
// MESSAGING TYPES - WhatsApp-style chat system
// =====================================================

export type MessageStatus = 'sent' | 'delivered' | 'seen';

// Message interface - matches database schema
export interface Message {
  _id: string;           // unique message id (used as key)
  senderId: string;      // sender's user id
  receiverId: string;    // receiver's user id
  content: string;       // message text
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  status: MessageStatus; // sent | delivered | seen
  createdAt: string;     // timestamp
  deliveredAt?: string | null;
  seenAt?: string | null;
}

// Conversation for sidebar list
export interface Conversation {
  _id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  participantSubtitle: string | null;
  participantSkillmirrorId: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
}

// Current user context
export interface CurrentUser {
  _id: string;
  name: string;
  avatar: string | null;
  skillmirrorId: string | null;
  role: 'student' | 'recruiter';
}

// Profile data for drawer
export interface StudentProfile {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  skillmirrorId: string | null;
  university: string | null;
  course: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
}

export interface RecruiterProfile {
  _id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  skillmirrorId: string | null;
  designation: string | null;
  companyName: string | null;
  companyWebsite: string | null;
}
