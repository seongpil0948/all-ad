-- 초대 수락 시 이메일 검증을 포함한 함수 수정
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_user_email TEXT;
  v_result JSONB;
BEGIN
  -- 현재 사용자 가져오기
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- 현재 사용자의 이메일 가져오기
  SELECT email INTO v_user_email 
  FROM public.profiles 
  WHERE id = v_user_id;
  
  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
  END IF;
  
  -- 초대 찾기
  SELECT * INTO v_invitation
  FROM public.team_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- 이메일 검증: 현재 로그인된 사용자의 이메일이 초대 이메일과 일치하는지 확인
  IF v_user_email != v_invitation.email THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Email mismatch: invitation sent to ' || v_invitation.email || ' but logged in as ' || v_user_email
    );
  END IF;
  
  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = v_invitation.team_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this team');
  END IF;
  
  -- 팀에 사용자 추가
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (v_invitation.team_id, v_user_id, v_invitation.role, v_invitation.invited_by);
  
  -- 초대 상태 업데이트
  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'team_id', v_invitation.team_id,
    'role', v_invitation.role
  );
END;
$$;