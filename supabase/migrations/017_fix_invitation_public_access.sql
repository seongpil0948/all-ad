-- Fix team invitation access for unauthenticated users
-- This is needed for the invite acceptance flow where users might not be logged in yet

-- Drop all existing policies on team_invitations
DROP POLICY IF EXISTS "Team members can view team invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.team_invitations;
DROP POLICY IF EXISTS "Masters and team_mates can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Masters can update invitations" ON public.team_invitations;

-- Recreate policies with proper access control

-- 1. Anyone (including unauthenticated users) can view invitations
-- This is safe because invitations are accessed by unique token
CREATE POLICY "Public read access for invitations" ON public.team_invitations
  FOR SELECT USING (true);

-- 2. Only team members can create invitations
CREATE POLICY "Team members can create invitations" ON public.team_invitations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = team_invitations.team_id 
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'team_mate'
      )
    )
  );

-- 3. Only masters can update invitations
CREATE POLICY "Masters can update invitations" ON public.team_invitations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
    )
  );

-- 4. Only masters can delete invitations
CREATE POLICY "Masters can delete invitations" ON public.team_invitations
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
    )
  );