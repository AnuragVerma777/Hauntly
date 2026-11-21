-- ==============================================================================
-- 🦇 HAUNTLY SUPABASE MIGRATION: FRIENDSHIPS TABLE & RLS POLICIES
-- ==============================================================================
-- Resolves PostgREST error PGRST205: "Could not find the table 'public.friendships' in the schema cache"
--
-- Features:
-- 1. Creates public.friendships table if not exists
-- 2. Foreign keys referencing auth.users(id) and public.profiles(id)
-- 3. Supports requester_id / sender_id and addressee_id / receiver_id
-- 4. Constraint preventing self-friending (requester_id <> addressee_id)
-- 5. Unique constraint & inverse index preventing duplicate friend requests
-- 6. Row Level Security (RLS) enabled with secure SELECT, INSERT, UPDATE, DELETE policies
-- 7. Automated trigger keeping sender_id/receiver_id in sync with requester_id/addressee_id
-- 8. PostgREST schema cache refresh notification
-- ==============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure public.profiles exists as a prerequisite for foreign key joins
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

-- 3. Create public.friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Prevent users from sending requests to themselves
  CONSTRAINT check_no_self_friending CHECK (requester_id <> addressee_id),
  -- Prevent exact duplicate rows
  CONSTRAINT unique_requester_addressee UNIQUE (requester_id, addressee_id)
);

-- 4. Safely add columns if the table already existed with an earlier partial schema
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.friendships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- 5. Foreign keys to public.profiles so PostgREST embeds (e.g. requester:profiles!requester_id) work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_friendships_requester_profile'
  ) THEN
    ALTER TABLE public.friendships
      ADD CONSTRAINT fk_friendships_requester_profile
      FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_friendships_addressee_profile'
  ) THEN
    ALTER TABLE public.friendships
      ADD CONSTRAINT fk_friendships_addressee_profile
      FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Trigger to keep sender_id/receiver_id in sync with requester_id/addressee_id
CREATE OR REPLACE FUNCTION public.handle_friendship_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync sender_id <-> requester_id
  IF NEW.requester_id IS NULL AND NEW.sender_id IS NOT NULL THEN
    NEW.requester_id := NEW.sender_id;
  END IF;
  IF NEW.sender_id IS NULL AND NEW.requester_id IS NOT NULL THEN
    NEW.sender_id := NEW.requester_id;
  END IF;

  -- Sync receiver_id <-> addressee_id
  IF NEW.addressee_id IS NULL AND NEW.receiver_id IS NOT NULL THEN
    NEW.addressee_id := NEW.receiver_id;
  END IF;
  IF NEW.receiver_id IS NULL AND NEW.addressee_id IS NOT NULL THEN
    NEW.receiver_id := NEW.addressee_id;
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_friendships_sync ON public.friendships;
CREATE TRIGGER trg_friendships_sync
  BEFORE INSERT OR UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_friendship_sync();

-- 7. Unique index to prevent inverse duplicate requests or friendships
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_friend_pair 
ON public.friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id))
WHERE status IN ('pending', 'accepted');

-- 8. High-performance query indexes
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_sender ON public.friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- 9. Row Level Security (RLS)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Clean existing policies before recreating
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;

-- RLS 1: SELECT (View)
-- Authenticated users can view friendships where they are requester, addressee, sender, or receiver
CREATE POLICY "Users can view their own friendships"
ON public.friendships
FOR SELECT
TO authenticated
USING (
  auth.uid() = requester_id 
  OR auth.uid() = addressee_id 
  OR auth.uid() = sender_id 
  OR auth.uid() = receiver_id
);

-- RLS 2: INSERT (Send Friend Request)
-- User can only initiate request as themselves, and cannot friend themselves
CREATE POLICY "Users can send friend requests"
ON public.friendships
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = requester_id OR auth.uid() = sender_id)
  AND requester_id <> addressee_id
);

-- RLS 3: UPDATE (Accept / Reject)
-- Either recipient or sender can update the friendship status
CREATE POLICY "Users can update their own friendships"
ON public.friendships
FOR UPDATE
TO authenticated
USING (
  auth.uid() = addressee_id 
  OR auth.uid() = requester_id 
  OR auth.uid() = receiver_id 
  OR auth.uid() = sender_id
)
WITH CHECK (
  auth.uid() = addressee_id 
  OR auth.uid() = requester_id 
  OR auth.uid() = receiver_id 
  OR auth.uid() = sender_id
);

-- RLS 4: DELETE (Unfriend / Cancel Request)
-- Either participant can cancel a pending request or remove a friendship
CREATE POLICY "Users can delete their own friendships"
ON public.friendships
FOR DELETE
TO authenticated
USING (
  auth.uid() = requester_id 
  OR auth.uid() = addressee_id 
  OR auth.uid() = sender_id 
  OR auth.uid() = receiver_id
);

-- 10. Enable Supabase Realtime publication on friendships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 11. Refresh Supabase PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
