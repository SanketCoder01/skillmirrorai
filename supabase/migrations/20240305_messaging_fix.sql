-- =====================================================
-- MESSAGING SYSTEM FIX - Clean up and rebuild
-- Run this to fix the schema issues
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL TRIGGERS ON MESSAGES FIRST
-- =====================================================
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS increment_unread ON messages;
DROP TRIGGER IF EXISTS update_last_message ON messages;

-- =====================================================
-- STEP 2: DROP ALL TRIGGERS ON CONVERSATIONS
-- =====================================================
DROP TRIGGER IF EXISTS create_participants ON conversations;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- =====================================================
-- STEP 3: DROP FUNCTIONS THAT REFERENCE MISSING COLUMNS
-- =====================================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS create_conversation_participants() CASCADE;

-- =====================================================
-- STEP 4: ADD MISSING COLUMNS TO MESSAGES
-- =====================================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to UUID;

-- Add check constraint for status
ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE messages ADD CONSTRAINT check_status CHECK (status IN ('sent', 'delivered', 'seen'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- =====================================================
-- STEP 5: CREATE CONVERSATIONS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant1_role TEXT NOT NULL DEFAULT 'student' CHECK (participant1_role IN ('student', 'recruiter')),
  participant2_role TEXT NOT NULL DEFAULT 'recruiter' CHECK (participant2_role IN ('student', 'recruiter')),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);

-- =====================================================
-- STEP 6: CREATE CONVERSATION_PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0,
  last_seen_message_id UUID,
  last_seen_at TIMESTAMPTZ,
  is_typing BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cp_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_cp_user ON conversation_participants(user_id);

-- =====================================================
-- STEP 7: CREATE USER_PRESENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_user ON user_presence(user_id);

-- =====================================================
-- STEP 8: CREATE TYPING_INDICATORS TABLE
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
-- STEP 9: RECREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for messages
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create conversation participants
CREATE OR REPLACE FUNCTION create_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (NEW.id, NEW.participant1_id), (NEW.id, NEW.participant2_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_participants
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION create_conversation_participants();

-- Function to increment unread count
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

CREATE TRIGGER increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_count();

-- Function to update last message
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

CREATE TRIGGER update_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- STEP 10: ENABLE RLS
-- =====================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 11: CREATE RLS POLICIES
-- =====================================================

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Conversation participants policies
CREATE POLICY "Users can view their participant records" ON conversation_participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their participant records" ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- User presence policies
CREATE POLICY "Users can view presence" ON user_presence FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can manage their presence" ON user_presence FOR ALL
  USING (auth.uid() = user_id);

-- Typing indicators policies
CREATE POLICY "Users can view typing" ON typing_indicators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = typing_indicators.conversation_id
    AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  ));

CREATE POLICY "Users can manage their typing" ON typing_indicators FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 12: GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- STEP 13: ENABLE REALTIME
-- =====================================================
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
