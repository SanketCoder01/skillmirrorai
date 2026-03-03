-- RUN THIS IN SUPABASE SQL EDITOR
-- This will fix the trigger issue causing "updated_at does not exist" error

-- Step 1: Drop all triggers
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS increment_unread ON messages;
DROP TRIGGER IF EXISTS update_last_message ON messages;
DROP TRIGGER IF EXISTS create_participants ON conversations;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;

-- Step 2: Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS create_conversation_participants() CASCADE;

-- Step 3: Add missing columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_sender BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_by_receiver BOOLEAN DEFAULT FALSE;

-- Step 4: Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create typing_indicators table
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- Step 6: Enable RLS
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies
CREATE POLICY "Users can view presence" ON user_presence FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Users can manage presence" ON user_presence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view typing" ON typing_indicators FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage typing" ON typing_indicators FOR ALL USING (auth.uid() = user_id);

-- Step 8: Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 9: Enable realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE user_presence REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;
