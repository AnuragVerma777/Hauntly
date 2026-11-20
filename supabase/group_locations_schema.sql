-- ════════════════════════════════════════════════════════════════════════════
-- HAUNTLY: GROUP LOCATIONS & 3D GLOBE SCHEMA WITH VOTING & SELECTION
-- Row Level Security (RLS) and Realtime enabled for collaborative group markers
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Table: public.group_locations
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
  is_selected BOOLEAN NOT NULL DEFAULT false,
  selected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  selected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for fast spatial and group queries
CREATE INDEX IF NOT EXISTS idx_group_locations_group_id ON public.group_locations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_locations_coords ON public.group_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_group_locations_created_at ON public.group_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_locations_selected ON public.group_locations(group_id, is_selected);

-- 3. Enable Row Level Security (RLS) on group_locations
ALTER TABLE public.group_locations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Only group members can view locations belonging to that group
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

-- 5. RLS Policy: Only group members can suggest/insert locations into that group
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

-- 6. RLS Policy: Location creator or group admin can update locations (including admin selecting final location)
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

-- 7. RLS Policy: Location creator or group admin can delete locations
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

-- ════════════════════════════════════════════════════════════════════════════
-- 8. Table: public.location_votes (Group Member Location Voting)
-- ════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.location_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.group_locations(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(location_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_location_votes_loc ON public.location_votes(location_id);
CREATE INDEX IF NOT EXISTS idx_location_votes_group ON public.location_votes(group_id);
CREATE INDEX IF NOT EXISTS idx_location_votes_user ON public.location_votes(user_id);

ALTER TABLE public.location_votes ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policy: Only group members can view votes in their group
CREATE POLICY "Group members can view location votes"
  ON public.location_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = location_votes.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- 10. RLS Policy: Only group members can cast votes (1 vote per user per location enforced by UNIQUE constraint)
CREATE POLICY "Group members can cast location votes"
  ON public.location_votes
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = location_votes.group_id
        AND group_members.user_id = auth.uid()
    )
  );

-- 11. RLS Policy: Users can remove their own votes
CREATE POLICY "Users can remove their own location vote"
  ON public.location_votes
  FOR DELETE
  USING (user_id = auth.uid());

-- 12. Add to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_votes;
