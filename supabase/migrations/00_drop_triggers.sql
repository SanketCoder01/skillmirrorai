-- RUN THIS FIRST - Drop all triggers immediately
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS increment_unread ON messages;
DROP TRIGGER IF EXISTS update_last_message ON messages;
DROP TRIGGER IF EXISTS create_participants ON conversations;
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS increment_unread_count() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS create_conversation_participants() CASCADE;
