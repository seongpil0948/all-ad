-- Fix all RLS recursion issues comprehensively

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Master users can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Master and editor can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Master can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Master can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Master can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Editor can insert team members" ON public.team_members;

-- Create or replace the helper function
CREATE OR REPLACE FUNCTION public.user_has_team_permission(check_team_id UUID, min_role user_role DEFAULT 'viewer')
RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN;
BEGIN
  -- Check if user is team master
  SELECT EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = check_team_id AND t.master_user_id = auth.uid()
  ) INTO has_permission;
  
  IF has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has required role in team
  IF min_role = 'viewer' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = check_team_id AND tm.user_id = auth.uid()
    ) INTO has_permission;
  ELSIF min_role = 'editor' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = check_team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role IN ('editor', 'master')
    ) INTO has_permission;
  ELSIF min_role = 'master' THEN
    -- Already checked above
    has_permission := FALSE;
  END IF;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create another helper function to get user's teams without recursion
CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS SETOF UUID AS $$
BEGIN
  -- Return teams where user is master
  RETURN QUERY
  SELECT id FROM public.teams WHERE master_user_id = auth.uid();
  
  -- Return teams where user is member
  RETURN QUERY
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Teams policies (without recursion)
CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    master_user_id = auth.uid() 
    OR 
    id IN (SELECT public.get_user_team_ids())
  );

CREATE POLICY "Masters can update their teams" ON public.teams
  FOR UPDATE USING (master_user_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (master_user_id = auth.uid());

CREATE POLICY "Masters can delete their teams" ON public.teams
  FOR DELETE USING (master_user_id = auth.uid());

-- Team members policies (without recursion)
CREATE POLICY "Users can view team members of their teams" ON public.team_members
  FOR SELECT USING (
    team_id IN (SELECT public.get_user_team_ids())
  );

CREATE POLICY "Masters can insert team members" ON public.team_members
  FOR INSERT WITH CHECK (
    public.user_has_team_permission(team_id, 'master')
  );

CREATE POLICY "Masters can update team members" ON public.team_members
  FOR UPDATE USING (
    public.user_has_team_permission(team_id, 'master')
  );

CREATE POLICY "Masters can delete team members" ON public.team_members
  FOR DELETE USING (
    public.user_has_team_permission(team_id, 'master')
  );

-- Update platform_credentials policies to use helper functions
DROP POLICY IF EXISTS "Team members can view credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Master and editor can manage credentials" ON public.platform_credentials;

CREATE POLICY "Team members can view credentials" ON public.platform_credentials
  FOR SELECT USING (
    team_id IN (SELECT public.get_user_team_ids())
  );

CREATE POLICY "Masters and editors can insert credentials" ON public.platform_credentials
  FOR INSERT WITH CHECK (
    public.user_has_team_permission(team_id, 'editor')
  );

CREATE POLICY "Masters and editors can update credentials" ON public.platform_credentials
  FOR UPDATE USING (
    public.user_has_team_permission(team_id, 'editor')
  );

CREATE POLICY "Masters and editors can delete credentials" ON public.platform_credentials
  FOR DELETE USING (
    public.user_has_team_permission(team_id, 'editor')
  );

-- Update campaigns policies to use helper functions
DROP POLICY IF EXISTS "Team members can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Master and editor can manage campaigns" ON public.campaigns;

CREATE POLICY "Team members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    team_id IN (SELECT public.get_user_team_ids())
  );

CREATE POLICY "Masters and editors can insert campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (
    public.user_has_team_permission(team_id, 'editor')
  );

CREATE POLICY "Masters and editors can update campaigns" ON public.campaigns
  FOR UPDATE USING (
    public.user_has_team_permission(team_id, 'editor')
  );

CREATE POLICY "Masters and editors can delete campaigns" ON public.campaigns
  FOR DELETE USING (
    public.user_has_team_permission(team_id, 'editor')
  );

-- Update campaign_metrics policies
DROP POLICY IF EXISTS "Team members can view metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "System can manage metrics" ON public.campaign_metrics;

CREATE POLICY "Team members can view metrics" ON public.campaign_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id 
        AND c.team_id IN (SELECT public.get_user_team_ids())
    )
  );

CREATE POLICY "Masters and editors can manage metrics" ON public.campaign_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id 
        AND public.user_has_team_permission(c.team_id, 'editor')
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_master_user ON public.teams(master_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_team ON public.team_members(user_id, team_id);

-- Add synced_at column to platform_credentials if it doesn't exist
ALTER TABLE public.platform_credentials 
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Grant necessary permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_team_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_team_ids TO authenticated;
