-- Drop the problematic policy
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;

-- Create a non-recursive policy for viewing team members
-- This policy allows users to view team members if they belong to the same team
CREATE POLICY "Users can view their team members" ON public.team_members
  FOR SELECT USING (
    -- User can see team members if they are part of the team
    user_id = auth.uid() 
    OR 
    -- Or if they share a team with the current user
    team_id IN (
      SELECT tm.team_id 
      FROM public.team_members tm 
      WHERE tm.user_id = auth.uid()
    )
  );

-- Also fix the "Master and editor can manage team members" policy to avoid recursion
DROP POLICY IF EXISTS "Master and editor can manage team members" ON public.team_members;

-- Create separate policies for INSERT, UPDATE, and DELETE to avoid recursion
CREATE POLICY "Master can insert team members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.master_user_id = auth.uid()
    )
  );

CREATE POLICY "Master can update team members" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.master_user_id = auth.uid()
    )
  );

CREATE POLICY "Master can delete team members" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.master_user_id = auth.uid()
    )
  );

-- Also create a policy for editors to manage team members (except other masters)
CREATE POLICY "Editor can insert team members" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role = 'editor'
    )
  );

-- Create a helper function to check if user has permission without recursion
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

-- Update other policies to use the helper function
-- Drop and recreate platform_credentials policies
DROP POLICY IF EXISTS "Team members can view credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Master and editor can manage credentials" ON public.platform_credentials;

CREATE POLICY "Team members can view credentials" ON public.platform_credentials
  FOR SELECT USING (
    public.user_has_team_permission(team_id, 'viewer')
  );

CREATE POLICY "Master and editor can manage credentials" ON public.platform_credentials
  FOR ALL USING (
    public.user_has_team_permission(team_id, 'editor')
  );

-- Drop and recreate campaigns policies
DROP POLICY IF EXISTS "Team members can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Master and editor can manage campaigns" ON public.campaigns;

CREATE POLICY "Team members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    public.user_has_team_permission(team_id, 'viewer')
  );

CREATE POLICY "Master and editor can manage campaigns" ON public.campaigns
  FOR ALL USING (
    public.user_has_team_permission(team_id, 'editor')
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_teams_master_user ON public.teams(master_user_id);
