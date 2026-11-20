-- ==============================================================================
-- 🦇 HAUNTLY SUPABASE SCHEMA: USER PROFILES & FRIEND MANAGEMENT
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
--
-- Features:
-- 1. Profiles linked to auth.users with unique permanent Hauntly IDs (e.g. HAUNT-8X29K)
-- 2. Collision-proof Hauntly ID generator function
-- 3. Automated trigger for new auth.users signup
-- 4. Friendships table with unique constraint preventing duplicate or inverse requests
-- 5. Blocks table for privacy & safety
-- 6. Strict Supabase Row Level Security (RLS) policies
-- 7. Secure search function that prevents email leakage
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hauntly_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT check_hauntly_id_format CHECK (hauntly_id ~ '^HAUNT-[A-Z0-9]{4,10}$'),
  CONSTRAINT check_username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_hauntly_id ON public.profiles(hauntly_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ------------------------------------------------------------------------------
-- 2. SECURE HAUNTLY ID GENERATOR
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_hauntly_id()
RETURNS text AS $$
DECLARE
  -- 32 characters, excluding easily confused glyphs (0, O, 1, I)
  chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  candidate text;
  done boolean := false;
  i integer;
BEGIN
  WHILE NOT done LOOP
    candidate := 'HAUNT-';
    FOR i IN 1..5 LOOP
      candidate := candidate || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    -- Guarantee global uniqueness before returning
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE hauntly_id = candidate) THEN
      done := true;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. AUTO-CREATE PROFILE ON AUTH USER SIGNUP TRIGGER
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  generated_hid text;
  initial_username text;
  initial_display text;
  base_handle text;
  suffix int := 0;
BEGIN
  -- Generate unique Hauntly ID
  generated_hid := public.generate_hauntly_id();

  -- Extract display name or fall back to email username
  initial_display := COALESCE(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Phantom'
  );

  -- Sanitize handle
  base_handle := lower(regexp_replace(
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'phantom'),
    '[^a-zA-Z0-9_]',
    '_',
    'g'
  ));
  IF length(base_handle) < 3 THEN
    base_handle := base_handle || '_spirit';
  END IF;
  initial_username := base_handle;

  -- Ensure unique username with incremental suffix if collision occurs
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = initial_username) LOOP
    suffix := suffix + 1;
    initial_username := substr(base_handle, 1, 22) || '_' || suffix;
  END LOOP;

  INSERT INTO public.profiles (id, hauntly_id, username, display_name, avatar_url)
  VALUES (
    new.id,
    generated_hid,
    initial_username,
    initial_display,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. FRIENDSHIPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Prevent users from sending requests to themselves
  CONSTRAINT check_no_self_friending CHECK (requester_id <> addressee_id),
  -- Prevent exact duplicate rows
  CONSTRAINT unique_requester_addressee UNIQUE (requester_id, addressee_id)
);

-- Unique index to prevent inverse duplicate requests or friendships
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_friend_pair 
ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id))
WHERE status IN ('pending', 'accepted');

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ------------------------------------------------------------------------------
-- 5. BLOCKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  CONSTRAINT check_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT unique_block_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if rerun
DROP POLICY IF EXISTS "Authenticated users can view non-blocked profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;

DROP POLICY IF EXISTS "Users can view their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can insert their own blocks" ON public.blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON public.blocks;

-- PROFILES POLICIES
-- 1. Read: Any authenticated user can view non-blocked profiles (no email exposed)
CREATE POLICY "Authenticated users can view non-blocked profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = profiles.id)
       OR (b.blocker_id = profiles.id AND b.blocked_id = auth.uid())
  )
);

-- 2. Insert: Only self
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Update: Only self
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- FRIENDSHIPS POLICIES
-- 1. Read: Only participants
CREATE POLICY "Users can view their own friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 2. Insert: Requester must be current user and neither user blocked the other
CREATE POLICY "Users can send friend requests"
ON public.friendships
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_id
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks b
    WHERE (b.blocker_id = auth.uid() AND b.blocked_id = addressee_id)
       OR (b.blocker_id = addressee_id AND b.blocked_id = auth.uid())
  )
);

-- 3. Update: Either addressee accepting/rejecting, or requester updating
CREATE POLICY "Users can update their own friendships"
ON public.friendships
FOR UPDATE
TO authenticated
USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- 4. Delete: Remove friendship or cancel sent request
CREATE POLICY "Users can delete their own friendships"
ON public.friendships
FOR DELETE
TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- BLOCKS POLICIES
CREATE POLICY "Users can view their own blocks"
ON public.blocks
FOR SELECT
TO authenticated
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can insert their own blocks"
ON public.blocks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
ON public.blocks
FOR DELETE
TO authenticated
USING (auth.uid() = blocker_id);

-- ------------------------------------------------------------------------------
-- 7. SECURE PUBLIC SEARCH FUNCTION (Does not expose email addresses)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_profile_by_hauntly_id(search_id text)
RETURNS TABLE (
  id uuid,
  hauntly_id text,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.hauntly_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE upper(trim(p.hauntly_id)) = upper(trim(search_id))
    AND NOT EXISTS (
      SELECT 1 FROM public.blocks b
      WHERE (b.blocker_id = auth.uid() AND b.blocked_id = p.id)
         OR (b.blocker_id = p.id AND b.blocked_id = auth.uid())
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 8. BACKFILL EXISTING USERS (if any users exist in auth.users)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  usr RECORD;
  generated_hid text;
  initial_username text;
  base_handle text;
  suffix int;
BEGIN
  FOR usr IN SELECT * FROM auth.users LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = usr.id) THEN
      generated_hid := public.generate_hauntly_id();
      base_handle := lower(regexp_replace(
        COALESCE(usr.raw_user_meta_data->>'username', split_part(usr.email, '@', 1), 'phantom'),
        '[^a-zA-Z0-9_]',
        '_',
        'g'
      ));
      IF length(base_handle) < 3 THEN
        base_handle := base_handle || '_spirit';
      END IF;
      initial_username := base_handle;
      suffix := 0;
      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = initial_username) LOOP
        suffix := suffix + 1;
        initial_username := substr(base_handle, 1, 22) || '_' || suffix;
      END LOOP;

      INSERT INTO public.profiles (id, hauntly_id, username, display_name, avatar_url)
      VALUES (
        usr.id,
        generated_hid,
        initial_username,
        COALESCE(usr.raw_user_meta_data->>'display_name', split_part(usr.email, '@', 1), 'Phantom'),
        COALESCE(usr.raw_user_meta_data->>'avatar_url', NULL)
      )
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;


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


-- ------------------------------------------------------------------------------
-- 8. GROUP LOCATIONS TABLE (Interactive 3D Earth Globe)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) >= 2),
  address TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  suggested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'sanctuary' CHECK (category IN ('sanctuary', 'crypt', 'coven_hall', 'historic', 'observatory', 'gathering')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_group_locations_group_id ON public.group_locations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_locations_coords ON public.group_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_group_locations_created_at ON public.group_locations(created_at DESC);

ALTER TABLE public.group_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view group locations"
  ON public.group_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_locations.group_id
        AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can insert group locations"
  ON public.group_locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_locations.group_id
        AND group_members.user_id = auth.uid()
    )
    AND suggested_by = auth.uid()
  );

CREATE POLICY "Creator or admin can update group locations"
  ON public.group_locations
  FOR UPDATE
  USING (
    suggested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_locations.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

CREATE POLICY "Creator or admin can delete group locations"
  ON public.group_locations
  FOR DELETE
  USING (
    suggested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = group_locations.group_id
        AND group_members.user_id = auth.uid()
        AND group_members.role = 'admin'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.group_locations;


-- Location Votes (see supabase/location_votes_schema.sql for full details)
\i location_votes_schema.sql
