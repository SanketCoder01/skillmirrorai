-- Migration: Add messaging and reports features
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. MESSAGES TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  attachment_url TEXT,
  attachment_name TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own received messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================
-- 2. SAVED_REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER DEFAULT 0,
  report_type TEXT DEFAULT 'career_analysis',
  target_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for saved_reports
CREATE INDEX IF NOT EXISTS idx_saved_reports_user ON saved_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_created ON saved_reports(created_at DESC);

-- Enable RLS
ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_reports
CREATE POLICY "Users can view their own reports" ON saved_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON saved_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON saved_reports
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. STORAGE BUCKETS
-- ============================================
-- Message attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-attachments
CREATE POLICY "Anyone can view message attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload message attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own message attachments" ON storage.objects
  FOR DELETE USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for reports
CREATE POLICY "Anyone can view reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports');

CREATE POLICY "Authenticated users can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own reports" ON storage.objects
  FOR DELETE USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- 4. REALTIME ENABLEMENT
-- ============================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- 5. ADD COLUMNS TO PROFILES IF MISSING
-- ============================================
-- Ensure profiles has all needed columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'resume_url') THEN
    ALTER TABLE profiles ADD COLUMN resume_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url TEXT;
  END IF;
END $$;
