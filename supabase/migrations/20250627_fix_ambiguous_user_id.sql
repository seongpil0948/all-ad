-- =====================================================
-- Fix Ambiguous user_id Reference in RLS Policies
-- =====================================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "tm_own" ON public.team_members;

-- Recreate with explicit table reference
CREATE POLICY "tm_own" ON public.team_members
  FOR SELECT USING (team_members.user_id = auth.uid());

-- Also fix the team_id references in other policies to be explicit
DROP POLICY IF EXISTS "tm_master_insert" ON public.team_members;
DROP POLICY IF EXISTS "tm_master_update" ON public.team_members;
DROP POLICY IF EXISTS "tm_master_delete" ON public.team_members;

-- Recreate with explicit references
CREATE POLICY "tm_master_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = auth.uid()
    )
  );

CREATE POLICY "tm_master_update" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = auth.uid()
    )
  );

CREATE POLICY "tm_master_delete" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = auth.uid()
    )
  );