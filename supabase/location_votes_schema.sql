-- ============================================================
-- Hauntly Location Votes Schema
-- Voting on group location suggestions with duplicate prevention
-- ============================================================

-- Table: location_votes
CREATE TABLE IF NOT EXISTS public.location_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.group_locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Prevent duplicate votes from the same user on the same location
  CONSTRAINT unique_vote_per_user_location UNIQUE (location_id, user_id)
);

-- Add selected_location_id to groups for admin-finalized location
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS selected_location_id UUID REFERENCES public.group_locations(id) ON DELETE SET NULL;

-- Add is_selected to group_locations for quick filtering
ALTER TABLE public.group_locations
  ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT false NOT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_location_votes_location_id ON public.location_votes (location_id);
CREATE INDEX IF NOT EXISTS idx_location_votes_user_id ON public.location_votes (user_id);
CREATE INDEX IF NOT EXISTS idx_group_locations_is_selected ON public.group_locations (group_id, is_selected) WHERE is_selected = true;

-- Row Level Security
ALTER TABLE public.location_votes ENABLE ROW LEVEL SECURITY;

-- Only group members can view votes
CREATE POLICY location_votes_select ON public.location_votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_locations gl
      JOIN public.group_members gm ON gm.group_id = gl.group_id
      WHERE gl.id = location_votes.location_id
        AND gm.user_id = auth.uid()
    )
  );

-- Only group members can vote (and only as themselves)
CREATE POLICY location_votes_insert ON public.location_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_locations gl
      JOIN public.group_members gm ON gm.group_id = gl.group_id
      WHERE gl.id = location_votes.location_id
        AND gm.user_id = auth.uid()
    )
  );

-- Users can only delete their own votes
CREATE POLICY location_votes_delete ON public.location_votes
  FOR DELETE USING (user_id = auth.uid());

-- Publish to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_votes;
