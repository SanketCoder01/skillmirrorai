-- =====================================================
-- DIRECT FIX - Add columns without triggering issues
-- =====================================================

-- Step 1: Completely remove all triggers and functions
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages CASCADE;
DROP TRIGGER IF EXISTS increment_unread ON messages CASCADE;
DROP TRIGGER IF EXISTS update_last_message ON messages CASCADE;
DROP TRIGGER IF EXISTS create_participants ON conversations CASCADE;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS create_conversation_participants() CASCADE;

-- Step 2: Add columns to messages (all at once, no triggers to interfere)
ALTER TABLE messages 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS conversation_id UUID,
  ADD COLUMN IF NOT EXISTS attachment_type TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reply_to UUID;

-- Step 3: Add constraint for status
ALTER TABLE messages DROP CONSTRAINT IF EXISTS check_status;
ALTER TABLE messages ADD CONSTRAINT check_status CHECK (status IN ('sent', 'delivered', 'seen'));

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Step 5: Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant1_role TEXT DEFAULT 'student',
  participant2_role TEXT DEFAULT 'recruiter',
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Step 6: Create conversation_participants table  
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unread_count INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  is_typing BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Step 7: Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Step 9: Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies (drop existing first)
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update received messages" ON messages;

CREATE POLICY "Users can view their messages" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received messages" ON messages FOR UPDATE
  USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

DROP POLICY IF EXISTS "Users can view their participant records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update their participant records" ON conversation_participants;

CREATE POLICY "Users can view their participant records" ON conversation_participants FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their participant records" ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view presence" ON user_presence;
DROP POLICY IF EXISTS "Users can manage their presence" ON user_presence;

CREATE POLICY "Users can view presence" ON user_presence FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Users can manage their presence" ON user_presence FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view typing" ON typing_indicators;
DROP POLICY IF EXISTS "Users can manage their typing" ON typing_indicators;

CREATE POLICY "Users can view typing" ON typing_indicators FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage their typing" ON typing_indicators FOR ALL USING (auth.uid() = user_id);

-- Step 11: Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 12: Enable realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;

-- Add to realtime publication (ignore if already added)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'conversations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'user_presence') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'typing_indicators') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
  END IF;
END $$;
