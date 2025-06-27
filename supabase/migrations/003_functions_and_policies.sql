-- =====================================================
-- 003_functions_and_policies.sql
-- RLS 정책, RPC 함수, 트리거, 권한 설정
-- =====================================================

-- =====================================================
-- Row Level Security 정책
-- =====================================================
-- NOTE: RLS policies have been moved to 20250627_emergency_fix_rls_clean_slate.sql
-- to prevent infinite recursion issues. This file now only contains
-- functions, triggers, and permissions.
-- =====================================================

-- =====================================================
-- RPC 함수
-- =====================================================

-- Function to create team for new user
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Create team
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(user_email, 'My Team'), user_id)
  RETURNING id INTO new_team_id;
  
  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept team invitation
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Find invitation
  SELECT * INTO v_invitation
  FROM public.team_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = v_invitation.team_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this team');
  END IF;
  
  -- Add user to team
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (v_invitation.team_id, v_user_id, v_invitation.role, v_invitation.invited_by);
  
  -- Update invitation status
  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'team_id', v_invitation.team_id,
    'role', v_invitation.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check team member limit
CREATE OR REPLACE FUNCTION public.check_team_member_limit(team_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_count INTEGER;
  team_limit INTEGER := 5; -- Default limit for V1.0
BEGIN
  -- Count existing members including master
  SELECT COUNT(*) INTO member_count
  FROM (
    SELECT user_id FROM public.team_members WHERE team_id = team_id_param
    UNION
    SELECT master_user_id FROM public.teams WHERE id = team_id_param
  ) AS all_members;
  
  RETURN member_count < team_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invitation by token (public access)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT 
    i.id,
    i.team_id,
    t.name as team_name,
    i.email,
    i.role,
    u.email as invited_by_email,
    i.status,
    i.expires_at
  INTO v_invitation
  FROM public.team_invitations i
  JOIN public.teams t ON i.team_id = t.id
  JOIN auth.users u ON i.invited_by = u.id
  WHERE i.token = invitation_token;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'id', v_invitation.id,
    'team_id', v_invitation.team_id,
    'team_name', v_invitation.team_name,
    'email', v_invitation.email,
    'role', v_invitation.role,
    'invited_by_email', v_invitation.invited_by_email,
    'status', v_invitation.status,
    'expires_at', v_invitation.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 트리거
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_credentials_updated_at BEFORE UPDATE ON public.platform_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 권한 설정
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- For authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- For anonymous users (limited access)
GRANT SELECT ON public.team_invitations TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon;