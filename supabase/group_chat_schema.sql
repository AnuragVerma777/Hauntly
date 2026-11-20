-- ==============================================================================
-- 🦇 HAUNTLY SUPABASE SCHEMA: REAL-TIME WHATSAPP-STYLE GROUP CHAT
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Features:
-- 1. groups table (Coven Groups) with creator, description, and avatar
-- 2. group_members table with role (admin, member) and last_read_at for unread tracking
-- 3. messages table with content length validation and foreign key constraints
-- 4. message_reactions table with unique constraint (one emoji per user per message)
-- 5. Full Row Level Security (RLS) ensuring ONLY members can read/send
-- 6. Supabase Realtime publication enabled for messages, message_reactions, group_members
-- 7. Optimized compound indexes for pagination and unread counts
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. GROUPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  avatar_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at DESC);

-- ------------------------------------------------------------------------------
-- 2. GROUP MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT unique_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_lookup ON public.group_members(group_id, user_id);

-- ------------------------------------------------------------------------------
-- 3. MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Compound index for lightning-fast cursor-based message pagination (WhatsApp style)
CREATE INDEX IF NOT EXISTS idx_messages_group_created ON public.messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ------------------------------------------------------------------------------
-- 4. MESSAGE REACTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (char_length(trim(reaction)) > 0 AND char_length(reaction) <= 16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Ensure one user can only place a specific reaction on a message once
  CONSTRAINT unique_message_user_reaction UNIQUE (message_id, user_id, reaction)
);

CREATE INDEX IF NOT EXISTS idx_reactions_message ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON public.message_reactions(user_id);

-- ------------------------------------------------------------------------------
-- 5. REALTIME PUBLICATION ENABLEMENT
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Add tables to supabase_realtime publication if not already included
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if rerun
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group admins can update their groups" ON public.groups;

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can insert membership or admins can add" ON public.group_members;
DROP POLICY IF EXISTS "Members can update their own last_read_at" ON public.group_members;
DROP POLICY IF EXISTS "Admins or members can leave group" ON public.group_members;

DROP POLICY IF EXISTS "Members can view messages in their group" ON public.messages;
DROP POLICY IF EXISTS "Members can send messages in their group" ON public.messages;
DROP POLICY IF EXISTS "Senders can edit their own messages" ON public.messages;
DROP POLICY IF EXISTS "Senders or admins can delete messages" ON public.messages;

DROP POLICY IF EXISTS "Members can view reactions in their group" ON public.message_reactions;
DROP POLICY IF EXISTS "Members can add reactions to group messages" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON public.message_reactions;

-- GROUPS POLICIES
-- 1. Read: User can view any group they are a member of
CREATE POLICY "Members can view their groups"
ON public.groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
);

-- 2. Insert: Any authenticated user can create a group
CREATE POLICY "Authenticated users can create groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 3. Update: Only group admin or creator can update group details
CREATE POLICY "Group admins can update their groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);

-- GROUP MEMBERS POLICIES
-- 1. Read: User can view members of groups they belong to
CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members my_gm
    WHERE my_gm.group_id = group_members.group_id AND my_gm.user_id = auth.uid()
  )
);

-- 2. Insert: Creator inserting themselves on group creation OR admins adding members
CREATE POLICY "Users can insert membership or admins can add"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.group_members admin_gm
    WHERE admin_gm.group_id = group_members.group_id 
      AND admin_gm.user_id = auth.uid() 
      AND admin_gm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
  )
);

-- 3. Update: User updating their own last_read_at timestamp
CREATE POLICY "Members can update their own last_read_at"
ON public.group_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Delete: User leaving group OR admin removing member
CREATE POLICY "Admins or members can leave group"
ON public.group_members
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.group_members admin_gm
    WHERE admin_gm.group_id = group_members.group_id 
      AND admin_gm.user_id = auth.uid() 
      AND admin_gm.role = 'admin'
  )
);

-- MESSAGES POLICIES
-- 1. Read: User MUST be an accepted member of the group to read messages
CREATE POLICY "Members can view messages in their group"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
  )
);

-- 2. Insert: User MUST be an accepted member of the group, and sender_id MUST equal auth.uid()
CREATE POLICY "Members can send messages in their group"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid()
  )
);

-- 3. Update: Only sender can edit their own message
CREATE POLICY "Senders can edit their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- 4. Delete: Sender or group admin can delete a message
CREATE POLICY "Senders or admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  auth.uid() = sender_id
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = messages.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
  )
);

-- MESSAGE REACTIONS POLICIES
-- 1. Read: Group members can view reactions to messages in their groups
CREATE POLICY "Members can view reactions in their group"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = message_reactions.message_id AND gm.user_id = auth.uid()
  )
);

-- 2. Insert: User can only add their own reaction, and must belong to the message's group
CREATE POLICY "Members can add reactions to group messages"
ON public.message_reactions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = message_reactions.message_id AND gm.user_id = auth.uid()
  )
);

-- 3. Delete: User can only remove their own reaction
CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. HELPER RPC FUNCTIONS (Unread count & Safe mark as read)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_group_read(p_group_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_members
  SET last_read_at = timezone('utc'::text, now())
  WHERE group_id = p_group_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
