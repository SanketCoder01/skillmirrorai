-- =====================================================
-- SKILLMIRROR FULL SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. MESSAGES TABLE (Realtime Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can select their messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- =====================================================
-- 2. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('message', 'approval', 'system')),
  title TEXT NOT NULL,
  content TEXT,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 3. UPDATE PROFILES TABLE (Add missing fields)
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS research_interest TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prn TEXT;

-- =====================================================
-- 4. UPDATE STUDENTS TABLE (Add missing fields)
-- =====================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS research_interest TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =====================================================
-- 5. CONVERSATIONS TABLE (For chat list)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id),
  participant2_id UUID NOT NULL REFERENCES auth.users(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can select their conversations" ON conversations
  FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can insert their conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- =====================================================
-- 6. FUNCTION TO CREATE NOTIFICATION ON MESSAGE
-- =====================================================
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, content, data)
  VALUES (
    NEW.receiver_id,
    'message',
    'New Message',
    'You have a new message',
    jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- =====================================================
-- 7. FUNCTION TO UPDATE CONVERSATION ON MESSAGE
-- =====================================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert conversation
  INSERT INTO conversations (participant1_id, participant2_id, last_message, last_message_at)
  VALUES (
    LEAST(NEW.sender_id, NEW.receiver_id),
    GREATEST(NEW.sender_id, NEW.receiver_id),
    NEW.content,
    NEW.created_at
  )
  ON CONFLICT (participant1_id, participant2_id) DO UPDATE
  SET last_message = NEW.content, last_message_at = NEW.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation ON messages;
CREATE TRIGGER trigger_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =====================================================
-- 8. ENABLE REALTIME FOR TABLES
-- =====================================================
-- Run in Supabase Dashboard: Database → Replication
-- Enable for: messages, notifications, conversations, students, profiles, recruiter_requests

-- Or use these commands (if you have superuser access):
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- =====================================================
-- 9. STORAGE BUCKETS
-- =====================================================
-- Run in Supabase Dashboard: Storage → Create Bucket
-- Create buckets: avatars, resumes
-- Set to public or configure RLS policies

-- Storage policies for avatars bucket:
-- Allow authenticated users to upload: bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
-- Allow public read: bucket_id = 'avatars'

-- Storage policies for resumes bucket:
-- Allow authenticated users to upload: bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]
-- Allow authenticated users to read: bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]

-- =====================================================
-- 10. FIX RLS FOR RECRUITERS (Allow public insert for approval flow)
-- =====================================================
  -- Add avatar_url to recruiters if not exists
  ALTER TABLE recruiters ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admin can insert recruiters" ON recruiters;
DROP POLICY IF EXISTS "Allow insert recruiters" ON recruiters;
DROP POLICY IF EXISTS "Users can update recruiter by email" ON recruiters;

-- Allow public insert (for approval flow from admin dashboard)
CREATE POLICY "Allow insert recruiters" ON recruiters
  FOR INSERT WITH CHECK (true);

-- Allow update by email match (for profile completion)
CREATE POLICY "Users can update recruiter by email" ON recruiters
  FOR UPDATE USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =====================================================
-- DONE! 
-- Now enable Realtime in Dashboard for these tables:
-- - messages
-- - notifications  
-- - conversations
-- - students
-- - profiles
-- - recruiter_requests
-- =====================================================
