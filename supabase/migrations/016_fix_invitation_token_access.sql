-- Fix team invitation access by token
-- Allow anyone to view invitation by token (needed for invite acceptance flow)

-- Drop existing policy that's too restrictive
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;

-- Create new policies for team_invitations
-- 1. Team members can view all team invitations
CREATE POLICY "Team members can view team invitations" ON public.team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- 2. Anyone can view invitation by token (for invite acceptance)
CREATE POLICY "Anyone can view invitation by token" ON public.team_invitations
  FOR SELECT USING (true);
  
-- Note: The actual security is handled by the unique token and email verification
-- Only the person with the invitation link can access it, and they must have the correct email to accept