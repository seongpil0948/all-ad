-- Recreate all the policies and tables after enum migration
-- This should run after 009a_fix_user_role_enum_safe.sql

-- Recreate RLS policies for team_members
CREATE POLICY IF NOT EXISTS "Team members can view team members" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    ) OR
    team_id IN (
      SELECT id FROM public.teams 
      WHERE master_user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Master and team_mate can manage team members" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.master_user_id = auth.uid()
    ) OR
    team_id IN (
      SELECT tm.team_id 
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'team_mate'
    )
  );

-- Update existing policies for platform_credentials
DROP POLICY IF EXISTS "Master and editor can manage credentials" ON public.platform_credentials;

CREATE POLICY IF NOT EXISTS "Master and team_mate can manage credentials" ON public.platform_credentials
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.master_user_id = auth.uid()
    ) OR
    team_id IN (
      SELECT tm.team_id 
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'team_mate'
    )
  );

-- Update existing policies for campaigns
DROP POLICY IF EXISTS "Master and editor can manage campaigns" ON public.campaigns;

CREATE POLICY IF NOT EXISTS "Master and team_mate can manage campaigns" ON public.campaigns
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.master_user_id = auth.uid()
    ) OR
    team_id IN (
      SELECT tm.team_id 
      FROM public.team_members tm
      WHERE tm.user_id = auth.uid() AND tm.role = 'team_mate'
    )
  );

-- Create team_invitations table if not exists
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, email)
);

-- Enable RLS on team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for team_invitations
CREATE POLICY IF NOT EXISTS "Team members can view invitations" ON public.team_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'team_mate'
    )
  );

CREATE POLICY IF NOT EXISTS "Masters and team_mates can create invitations" ON public.team_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = team_invitations.team_id 
      AND team_members.user_id = auth.uid()
      AND team_members.role = 'team_mate'
    )
  );

CREATE POLICY IF NOT EXISTS "Masters can update invitations" ON public.team_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams WHERE teams.id = team_invitations.team_id AND teams.master_user_id = auth.uid()
    )
  );

-- Check constraint for role values in team_invitations (only team_mate and viewer can be invited)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'team_invitations_role_check'
  ) THEN
    ALTER TABLE team_invitations 
    ADD CONSTRAINT team_invitations_role_check 
    CHECK (role IN ('team_mate', 'viewer'));
  END IF;
END $$;

-- Function to check team member limit (V1.0: max 5 members per account)
CREATE OR REPLACE FUNCTION check_team_member_limit(team_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_count INTEGER;
  invitation_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Count existing members (including master)
  SELECT COUNT(*) INTO member_count
  FROM (
    SELECT master_user_id AS user_id FROM teams WHERE id = team_id_param
    UNION
    SELECT user_id FROM team_members WHERE team_id = team_id_param
  ) AS all_members;
  
  -- Count pending invitations
  SELECT COUNT(*) INTO invitation_count
  FROM team_invitations
  WHERE team_id = team_id_param AND status = 'pending';
  
  total_count := member_count + invitation_count;
  
  -- V1.0: Maximum 5 members per team
  RETURN total_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION accept_team_invitation(invitation_token UUID)
RETURNS JSONB AS $$
DECLARE
  invitation_record RECORD;
  user_id UUID;
  result JSONB;
BEGIN
  -- Get current user
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM team_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();
    
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user email matches invitation email
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND email = invitation_record.email
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email does not match invitation');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = invitation_record.team_id AND user_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM teams 
    WHERE id = invitation_record.team_id AND master_user_id = user_id
  ) THEN
    -- Update invitation status
    UPDATE team_invitations 
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this team');
  END IF;
  
  -- Add user to team
  INSERT INTO team_members (team_id, user_id, role, invited_by)
  VALUES (invitation_record.team_id, user_id, invitation_record.role, invitation_record.invited_by);
  
  -- Update invitation status
  UPDATE team_invitations 
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = invitation_record.id;
  
  RETURN jsonb_build_object('success', true, 'team_id', invitation_record.team_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);