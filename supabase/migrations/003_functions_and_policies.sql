-- =====================================================
-- 003_functions_and_policies.sql
-- RLS 정책, RPC 함수, 트리거, 권한 설정
-- =====================================================

-- =====================================================
-- Row Level Security 정책
-- =====================================================

-- Teams policies
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    master_user_id = auth.uid() OR
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master users can update their teams" ON public.teams
  FOR UPDATE USING (master_user_id = auth.uid());

CREATE POLICY "Master users can delete their teams" ON public.teams
  FOR DELETE USING (master_user_id = auth.uid());

-- Team members policies
CREATE POLICY "Team members can view team members" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master and team_mate can insert team members" ON public.team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('master', 'team_mate')
    )
  );

CREATE POLICY "Master can update team members" ON public.team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
    )
  );

CREATE POLICY "Master can delete team members" ON public.team_members
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
    )
  );

-- Team invitations policies
CREATE POLICY "Team members can view invitations for their team" ON public.team_invitations
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invitation by token" ON public.team_invitations
  FOR SELECT USING (true);

CREATE POLICY "Master and team_mate can create invitations" ON public.team_invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('master', 'team_mate')
    )
  );

CREATE POLICY "Master can update invitations" ON public.team_invitations
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
    )
  );

-- Platform credentials policies
CREATE POLICY "Team members can view platform credentials" ON public.platform_credentials
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master and team_mate can manage platform credentials" ON public.platform_credentials
  FOR ALL USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('master', 'team_mate')
    )
  );

-- Campaigns policies
CREATE POLICY "Team members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage campaigns" ON public.campaigns
  FOR ALL USING (
    team_id IN (
      SELECT id FROM public.teams WHERE master_user_id = auth.uid()
      UNION
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('master', 'team_mate')
    )
  );

-- Campaign metrics policies
CREATE POLICY "Team members can view campaign metrics" ON public.campaign_metrics
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE team_id IN (
        SELECT id FROM public.teams WHERE master_user_id = auth.uid()
        UNION
        SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage campaign metrics" ON public.campaign_metrics
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE team_id IN (
        SELECT id FROM public.teams WHERE master_user_id = auth.uid()
        UNION
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid() AND role IN ('master', 'team_mate')
      )
    )
  );

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