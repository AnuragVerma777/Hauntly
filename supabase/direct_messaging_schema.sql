-- ==============================================================================
-- 🦇 HAUNTLY SUPABASE MIGRATION: DIRECT MESSAGING (WHISPERS) SCHEMA
-- ==============================================================================
-- Run this in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/acjarwkdopbjcrvsklry/sql
--
-- Features:
-- 1. Conversations table (1-to-1 private chat sessions between 2 users)
-- 2. Direct Messages table (individual messages inside conversations)
-- 3. Canonical unique index preventing duplicate conversations between the same two users
-- 4. Constraint preventing users from messaging themselves
-- 5. Foreign keys referencing auth.users(id) and public.profiles(id)
-- 6. Strict Row Level Security (RLS):
--    - Only conversation participants can view/read messages
--    - Only authenticated sender can insert messages into their own conversation
--    - Only sender can delete their own messages
--    - No passwords or private auth data exposed
-- 7. Auto-updates conversation's last_message_at via database trigger
-- 8. Added to Supabase Realtime publication
-- ==============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure public.profiles table exists as prerequisite for foreign key joins
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hauntly_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Prevent users from conversing with themselves
  CONSTRAINT check_no_self_conversation CHECK (user1_id <> user2_id)
);

-- Foreign keys to profiles for PostgREST embed queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_user1_profile'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT fk_conversations_user1_profile
      FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_user2_profile'
  ) THEN
    ALTER TABLE public.conversations
      ADD CONSTRAINT fk_conversations_user2_profile
      FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Canonical unique index: ensures exactly one conversation between any two users
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_conversation_pair 
ON public.conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

-- 4. Direct Messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 5000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Prevent users from messaging themselves
  CONSTRAINT check_no_self_message CHECK (sender_id <> receiver_id)
);

-- Foreign keys to profiles for PostgREST embed queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_direct_messages_sender_profile'
  ) THEN
    ALTER TABLE public.direct_messages
      ADD CONSTRAINT fk_direct_messages_sender_profile
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_direct_messages_receiver_profile'
  ) THEN
    ALTER TABLE public.direct_messages
      ADD CONSTRAINT fk_direct_messages_receiver_profile
      FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_direct_messages_conv_created ON public.direct_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id);

-- 5. Trigger to update conversations.last_message_at on new message
CREATE OR REPLACE FUNCTION public.handle_new_direct_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message = LEFT(NEW.content, 100),
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_direct_messages_update_conversation ON public.direct_messages;
CREATE TRIGGER trg_direct_messages_update_conversation
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_direct_message();

-- 6. Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Clean existing policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON public.conversations;

DROP POLICY IF EXISTS "Only conversation participants can read messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Only authenticated participants can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Participants can update messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Only sender can delete their message" ON public.direct_messages;

-- RLS: Conversations
-- SELECT: Only conversation participants can view
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- INSERT: Only authenticated participants can create, and must participate
CREATE POLICY "Users can create conversations they participate in"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user1_id OR auth.uid() = user2_id)
  AND user1_id <> user2_id
);

-- UPDATE: Only participants can update
CREATE POLICY "Users can update their conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- DELETE: Only participants can delete
CREATE POLICY "Users can delete their conversations"
ON public.conversations
FOR DELETE
TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS: Direct Messages
-- SELECT: Only conversation participants can read messages
CREATE POLICY "Only conversation participants can read messages"
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
  OR EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = direct_messages.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

-- INSERT: Only authenticated participants can send messages, must be sender, cannot self-message
CREATE POLICY "Only authenticated participants can send messages"
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND sender_id <> receiver_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = direct_messages.conversation_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

-- UPDATE: Sender can edit, recipient can mark read
CREATE POLICY "Participants can update messages"
ON public.direct_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- DELETE: Only sender can delete their message
CREATE POLICY "Only sender can delete their message"
ON public.direct_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- 7. Add to Realtime Publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 8. Refresh Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';
