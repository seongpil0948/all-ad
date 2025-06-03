-- Fix infinite recursion in team_members RLS policies
-- This happens when policies reference the same table they're protecting

-- First, drop all existing policies on team_members to start fresh
DROP POLICY IF EXISTS "Team members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Master and team_mate can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Master and editor can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their team members" ON public.team_members;
DROP POLICY IF EXISTS "Master can insert team members" ON public.team_members;
DROP POLICY IF EXISTS "Master can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Master can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Editor can insert team members" ON public.team_members;

-- Also drop policies on teams that might cause recursion
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Master users can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

-- Create new non-recursive policies for teams table first
-- These don't reference team_members table to avoid recursion
CREATE POLICY "Users can view teams they own" ON public.teams
  FOR SELECT USING (master_user_id = auth.uid());

CREATE POLICY "Team masters can update their teams" ON public.teams
  FOR UPDATE USING (master_user_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (master_user_id = auth.uid());

-- Create a simple function to check team membership without recursion
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Direct check without recursive queries
  SELECT EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.team_id = check_team_id 
    AND tm.user_id = check_user_id
  ) INTO is_member;
  
  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create a function to check if user is team master
CREATE OR REPLACE FUNCTION public.is_team_master(check_team_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  is_master BOOLEAN;
BEGIN
  -- Direct check without recursive queries
  SELECT EXISTS (
    SELECT 1 
    FROM public.teams t
    WHERE t.id = check_team_id 
    AND t.master_user_id = check_user_id
  ) INTO is_master;
  
  RETURN is_master;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new policies for team_members using the helper functions
-- For SELECT: Users can view team members if they are in the team or are the master
CREATE POLICY "Users can view team members" ON public.team_members
  FOR SELECT USING (
    auth.uid() = user_id OR  -- Can see own membership
    public.is_team_member(team_id, auth.uid()) OR  -- Can see team members if in team
    public.is_team_master(team_id, auth.uid())  -- Masters can see all members
  );

-- For INSERT: Only team masters and team_mates can add new members
CREATE POLICY "Masters and team_mates can add team members" ON public.team_members
  FOR INSERT WITH CHECK (
    public.is_team_master(team_id, auth.uid()) OR
    (public.is_team_member(team_id, auth.uid()) AND 
     EXISTS (
       SELECT 1 FROM public.team_members 
       WHERE team_id = team_members.team_id 
       AND user_id = auth.uid() 
       AND role IN ('master', 'team_mate')
     ))
  );

-- For UPDATE: Only team masters can update team members
CREATE POLICY "Masters can update team members" ON public.team_members
  FOR UPDATE USING (
    public.is_team_master(team_id, auth.uid())
  );

-- For DELETE: Only team masters can remove team members
CREATE POLICY "Masters can delete team members" ON public.team_members
  FOR DELETE USING (
    public.is_team_master(team_id, auth.uid())
  );

-- Now update policies for other tables that reference teams
-- For platform_credentials
DROP POLICY IF EXISTS "Team members can view credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Master and team_mate can manage credentials" ON public.platform_credentials;
DROP POLICY IF EXISTS "Master and editor can manage credentials" ON public.platform_credentials;

CREATE POLICY "Team members can view credentials" ON public.platform_credentials
  FOR SELECT USING (
    public.is_team_member(team_id, auth.uid()) OR
    public.is_team_master(team_id, auth.uid())
  );

CREATE POLICY "Masters and team_mates can manage credentials" ON public.platform_credentials
  FOR ALL USING (
    public.is_team_master(team_id, auth.uid()) OR
    (public.is_team_member(team_id, auth.uid()) AND 
     EXISTS (
       SELECT 1 FROM public.team_members 
       WHERE team_id = platform_credentials.team_id 
       AND user_id = auth.uid() 
       AND role IN ('master', 'team_mate')
     ))
  );

-- For campaigns
DROP POLICY IF EXISTS "Team members can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Master and team_mate can manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Master and editor can manage campaigns" ON public.campaigns;

CREATE POLICY "Team members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    public.is_team_member(team_id, auth.uid()) OR
    public.is_team_master(team_id, auth.uid())
  );

CREATE POLICY "Masters and team_mates can manage campaigns" ON public.campaigns
  FOR ALL USING (
    public.is_team_master(team_id, auth.uid()) OR
    (public.is_team_member(team_id, auth.uid()) AND 
     EXISTS (
       SELECT 1 FROM public.team_members 
       WHERE team_id = campaigns.team_id 
       AND user_id = auth.uid() 
       AND role IN ('master', 'team_mate')
     ))
  );

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.is_team_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_master TO authenticated;

-- Add a special policy for teams table to allow viewing teams where user is a member
CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT USING (
    master_user_id = auth.uid() OR
    public.is_team_member(id, auth.uid())
  );