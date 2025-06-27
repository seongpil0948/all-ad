-- =====================================================
-- EMERGENCY FIX: Complete RLS Reset to Resolve Infinite Recursion
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- STEP 1: List all current policies (for debugging)
-- =====================================================
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE 'Current policies on affected tables:';
  FOR rec IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE tablename IN ('teams', 'team_members', 'campaigns', 'platform_credentials', 'team_invitations')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '- %.%: %', rec.schemaname, rec.tablename, rec.policyname;
  END LOOP;
END $$;

-- =====================================================
-- STEP 2: Drop ALL policies on ALL affected tables
-- =====================================================

-- Drop all policies on teams
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'teams'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teams', policy_rec.policyname);
  END LOOP;
END $$;

-- Drop all policies on team_members
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'team_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', policy_rec.policyname);
  END LOOP;
END $$;

-- Drop all policies on campaigns
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'campaigns'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaigns', policy_rec.policyname);
  END LOOP;
END $$;

-- Drop all policies on platform_credentials
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'platform_credentials'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_credentials', policy_rec.policyname);
  END LOOP;
END $$;

-- Drop all policies on team_invitations
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  FOR policy_rec IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'team_invitations'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_invitations', policy_rec.policyname);
  END LOOP;
END $$;

-- =====================================================
-- STEP 3: Create minimal policies to break recursion
-- =====================================================

-- TEAMS: Simple policies without any joins
CREATE POLICY "teams_own" ON public.teams
  FOR SELECT USING (master_user_id = auth.uid());

CREATE POLICY "teams_insert" ON public.teams
  FOR INSERT WITH CHECK (master_user_id = auth.uid());

CREATE POLICY "teams_update" ON public.teams
  FOR UPDATE USING (master_user_id = auth.uid());

CREATE POLICY "teams_delete" ON public.teams
  FOR DELETE USING (master_user_id = auth.uid());

-- TEAM_MEMBERS: Base policy for own membership
CREATE POLICY "tm_own" ON public.team_members
  FOR SELECT USING (user_id = auth.uid());

-- TEAM_MEMBERS: Master can view all (using direct join to teams)
CREATE POLICY "tm_master_view" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = auth.uid()
    )
  );

-- TEAM_MEMBERS: Master can manage
CREATE POLICY "tm_master_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
      AND t.master_user_id = auth.uid()
    )
  );

CREATE POLICY "tm_master_update" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
      AND t.master_user_id = auth.uid()
    )
  );

CREATE POLICY "tm_master_delete" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
      AND t.master_user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 4: Add simple function to check team membership
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_teams(user_id UUID)
RETURNS TABLE(team_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id
  FROM public.teams t
  WHERE t.master_user_id = user_id
  UNION
  SELECT tm.team_id
  FROM public.team_members tm
  WHERE tm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 5: Add policies for teams using the function
-- =====================================================

-- Allow users to see teams they're members of
CREATE POLICY "teams_member_view" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

-- =====================================================
-- STEP 6: Add policies for dependent tables
-- =====================================================

-- CAMPAIGNS: Use the function to avoid recursion
CREATE POLICY "campaigns_view" ON public.campaigns
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

CREATE POLICY "campaigns_manage" ON public.campaigns
  FOR ALL USING (
    team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

-- PLATFORM_CREDENTIALS: Use the function
CREATE POLICY "pc_view" ON public.platform_credentials
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

CREATE POLICY "pc_manage" ON public.platform_credentials
  FOR ALL USING (
    team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

-- TEAM_INVITATIONS: Use the function
CREATE POLICY "ti_view" ON public.team_invitations
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

CREATE POLICY "ti_insert" ON public.team_invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() 
    AND team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  );

CREATE POLICY "ti_update" ON public.team_invitations
  FOR UPDATE USING (
    team_id IN (SELECT t.id FROM public.teams t WHERE t.master_user_id = auth.uid())
  );

-- =====================================================
-- STEP 7: Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.user_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_teams(UUID) TO anon;

-- Commit the transaction
COMMIT;

-- =====================================================
-- Verification
-- =====================================================

-- Check that policies were created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename IN ('teams', 'team_members', 'campaigns', 'platform_credentials', 'team_invitations')
ORDER BY tablename, policyname;