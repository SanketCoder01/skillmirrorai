-- =====================================================
-- MESSAGING SYSTEM UPGRADE - Add missing columns/tables
-- Run this AFTER 20240302_messaging_reports.sql
-- =====================================================

-- =====================================================
-- 0. DROP ANY EXISTING TRIGGERS THAT MAY CAUSE ISSUES
-- =====================================================
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS increment_unread ON messages;
DROP TRIGGER IF EXISTS update_last_message ON messages;
DROP TRIGGER IF EXISTS create_participants ON conversations;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- Drop any existing functions that might conflict
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS create_conversation_participants() CASCADE;

-- =====================================================
-- 1. ADD MISSING COLUMNS TO MESSAGES TABLE
-- =====================================================

-- Add updated_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add conversation_id (nullable, since conversations are optional)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- Add attachment_type
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add status column (sent, delivered, seen)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';

-- Drop and recreate check constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_status;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_status'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT check_status CHECK (status IN ('sent', 'delivered', 'seen'));
  END IF;
END $$;

-- Update existing rows to have 'sent' status if null
UPDATE messages SET status = 'sent' WHERE status IS NULL;

-- Add delivered_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add seen_at
ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;

-- Add deleted_by_sender
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE;

-- Add deleted_by_receiver
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE;

-- Add reply_to (self-reference)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to UUID;

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- =====================================================
-- 2. CREATE CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Participant roles for fixed alignment
  participant1_role TEXT NOT NULL CHECK (participant1_role IN ('student', 'recruiter')),
  participant2_role TEXT NOT NULL CHECK (participant2_role IN ('student', 'recruiter')),
  
  -- Last message preview
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique conversation between two users
  UNIQUE(participant1_id, participant2_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);

-- Now add foreign key to messages.conversation_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_fkey' 
    AND table_name = 'messages'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- 3. CREATE CONVERSATION PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Unread count
  unread_count INTEGER DEFAULT 0,
  
  -- Last seen message
  last_seen_message_id UUID REFERENCES messages(id),
  last_seen_at TIMESTAMPTZ,
  
  -- Typing status
  is_typing BOOLEAN DEFAULT FALSE,
  
  -- Block status
  is_blocked BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cp_user ON conversation_participants(user_id);

-- =====================================================
-- 4. CREATE USER PRESENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Online status
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  
  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_online ON user_presence(is_online);

-- =====================================================
-- 5. CREATE TYPING INDICATORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create conversation participants automatically
CREATE OR REPLACE FUNCTION create_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (NEW.id, NEW.participant1_id), (NEW.id, NEW.participant2_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_participants ON conversations;
CREATE TRIGGER create_participants
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_participants();

-- Function to increment unread count on new message
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversation_participants
    SET unread_count = unread_count + 1, updated_at = NOW()
    WHERE conversation_id = NEW.conversation_id
      AND user_id = NEW.receiver_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_unread ON messages;
CREATE TRIGGER increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Function to update conversation's last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_id IS NOT NULL THEN
    UPDATE conversations
    SET last_message = NEW.content,
        last_message_at = NEW.created_at,
        last_message_sender_id = NEW.sender_id,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_last_message ON messages;
CREATE TRIGGER update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Conversation participants policies
CREATE POLICY "Users can view their participant records"
  ON conversation_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their participant records"
  ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- User presence policies
CREATE POLICY "Users can view all presence"
  ON user_presence FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update their presence"
  ON user_presence FOR ALL
  USING (auth.uid() = user_id);

-- Typing indicators policies
CREATE POLICY "Users can view typing in their conversations"
  ON typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = typing_indicators.conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their typing status"
  ON typing_indicators FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- 9. REALTIME ENABLEMENT
-- =====================================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
