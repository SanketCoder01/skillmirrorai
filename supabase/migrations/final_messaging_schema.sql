-- =====================================================
-- COMPLETE MESSAGING SCHEMA - Run in Supabase SQL Editor
-- =====================================================

-- STEP 1: Drop all existing triggers (ignore errors if not exist)
DO $$
BEGIN
    EXECUTE 'DROP TRIGGER IF EXISTS update_messages_updated_at ON messages';
    EXECUTE 'DROP TRIGGER IF EXISTS increment_unread ON messages';
    EXECUTE 'DROP TRIGGER IF EXISTS update_last_message ON messages';
    EXECUTE 'DROP TRIGGER IF EXISTS create_participants ON conversations';
    EXECUTE 'DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- STEP 2: Drop all existing functions (ignore errors if not exist)
DO $$
BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS increment_unread_count() CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE';
    EXECUTE 'DROP FUNCTION IF EXISTS create_conversation_participants() CASCADE';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- STEP 3: Add missing columns to messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'status') THEN
        ALTER TABLE messages ADD COLUMN status TEXT DEFAULT 'sent';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'updated_at') THEN
        ALTER TABLE messages ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'delivered_at') THEN
        ALTER TABLE messages ADD COLUMN delivered_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'seen_at') THEN
        ALTER TABLE messages ADD COLUMN seen_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_by_sender') THEN
        ALTER TABLE messages ADD COLUMN deleted_by_sender BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'deleted_by_receiver') THEN
        ALTER TABLE messages ADD COLUMN deleted_by_receiver BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- STEP 4: Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant1_id, participant2_id)
);

-- STEP 5: Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 6: Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- STEP 7: Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies
CREATE POLICY "Users can view their conversations" ON conversations FOR SELECT
    USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT
    WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can view presence" ON user_presence FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Users can manage presence" ON user_presence FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view typing" ON typing_indicators FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage typing" ON typing_indicators FOR ALL USING (auth.uid() = user_id);

-- STEP 9: Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- STEP 10: Enable realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;
