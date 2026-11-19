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
