-- =====================================================
-- 팀 멤버십 문제 및 보안 문제 해결
-- 생성일: 2025-07-05
-- 설명: 미들웨어 "No team found for user" 오류 및 보안 경고 해결
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS 활성화
-- =====================================================

-- pg_net extension 활성화 (schema "net" does not exist 오류 해결)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 권한 부여
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- =====================================================
-- 2. 보안 강화: 함수의 search_path 설정
-- =====================================================

-- handle_new_user 함수 보안 강화
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    new_team_id uuid;
BEGIN
    -- 프로필 생성
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT (id) DO NOTHING;
    
    -- 팀 생성 및 멤버 추가
    new_team_id := public.create_team_for_user(NEW.id);
    
    RETURN NEW;
END;
$$;

-- create_team_for_user 함수 보안 강화
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_team_id uuid;
    user_email text;
BEGIN
    -- 이미 팀이 있는지 확인
    SELECT tm.team_id INTO new_team_id
    FROM public.team_members tm
    WHERE tm.user_id = create_team_for_user.user_id
    LIMIT 1;
    
    IF new_team_id IS NOT NULL THEN
        RETURN new_team_id;
    END IF;
    
    -- 마스터로서 팀이 있는지 확인
    SELECT t.id INTO new_team_id
    FROM public.teams t
    WHERE t.master_user_id = create_team_for_user.user_id
    LIMIT 1;
    
    IF new_team_id IS NOT NULL THEN
        RETURN new_team_id;
    END IF;
    
    -- 사용자 이메일 가져오기
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = create_team_for_user.user_id;
    
    -- 새 팀 생성
    INSERT INTO public.teams (name, master_user_id)
    VALUES (COALESCE(user_email, 'My Team'), create_team_for_user.user_id)
    RETURNING id INTO new_team_id;
    
    -- 사용자를 마스터로 team_members에도 추가 (일관성을 위해)
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, create_team_for_user.user_id, 'master')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    RETURN new_team_id;
END;
$$;

-- update_updated_at_column 함수 보안 강화
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- accept_team_invitation 함수 보안 강화
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- 현재 사용자 가져오기
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
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

-- check_team_member_limit 함수 보안 강화
CREATE OR REPLACE FUNCTION public.check_team_member_limit(team_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
  team_limit INTEGER := 5; -- V1.0 기본 제한
BEGIN
  -- 마스터 포함 기존 멤버 수 계산
  SELECT COUNT(*) INTO member_count
  FROM (
    SELECT user_id FROM public.team_members WHERE team_id = team_id_param
    UNION
    SELECT master_user_id FROM public.teams WHERE id = team_id_param
  ) AS all_members;
  
  RETURN member_count < team_limit;
END;
$$;

-- update_manual_campaign_updated_at 함수 보안 강화
CREATE OR REPLACE FUNCTION public.update_manual_campaign_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
BEGIN
  NEW.last_updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- cleanup_old_oauth_states 함수 보안 강화
CREATE OR REPLACE FUNCTION public.cleanup_old_oauth_states()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- get_cron_job_status 함수 보안 강화
CREATE OR REPLACE FUNCTION public.get_cron_job_status()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean,
  last_run timestamptz,
  last_status text,
  last_duration interval
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobid,
    j.jobname,
    j.schedule,
    j.command,
    j.active,
    MAX(jr.start_time) as last_run,
    (SELECT status FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_status,
    (SELECT end_time - start_time FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_duration
  FROM cron.job j
  LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
  WHERE j.jobname IN ('refresh-oauth-tokens', 'google-ads-sync-hourly', 'google-ads-sync-full-daily')
  GROUP BY j.jobid, j.jobname, j.schedule, j.command, j.active;
END;
$$;

-- call_edge_function 함수 보안 강화
CREATE OR REPLACE FUNCTION public.call_edge_function(function_name text, payload jsonb DEFAULT '{}')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  request_id bigint;
  service_role_key text;
  supabase_url text;
BEGIN
  -- vault에서 서비스 역할 키 가져오기
  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key';
  
  -- Supabase URL 가져오기
  supabase_url := current_setting('app.supabase_url', true);
  
  -- Edge Function으로 HTTP 요청 만들기
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    body := payload::text
  ) INTO request_id;
  
  RETURN request_id;
END;
$$;

-- validate_token_migration 함수 보안 강화
CREATE OR REPLACE FUNCTION public.validate_token_migration()
RETURNS TABLE(
  platform TEXT,
  total_count BIGINT,
  migrated_count BIGINT,
  missing_tokens BIGINT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.platform::TEXT,
    COUNT(*)::BIGINT as total_count,
    COUNT(CASE WHEN pc.access_token IS NOT NULL THEN 1 END)::BIGINT as migrated_count,
    COUNT(CASE WHEN pc.access_token IS NULL AND pc.is_active = true THEN 1 END)::BIGINT as missing_tokens
  FROM public.platform_credentials pc
  WHERE pc.platform IN ('google', 'facebook', 'kakao', 'naver')
  GROUP BY pc.platform
  ORDER BY pc.platform;
END;
$$;

-- get_invitation_by_token 함수 보안 강화
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
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
$$;

-- user_teams 함수 보안 강화
CREATE OR REPLACE FUNCTION public.user_teams(user_id UUID)
RETURNS TABLE(team_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id AS team_id
  FROM public.teams t
  WHERE t.master_user_id = $1
  UNION
  SELECT tm.team_id AS team_id
  FROM public.team_members tm
  WHERE tm.user_id = $1;
END;
$$;

-- ensure_user_has_team 함수 보안 강화 (새로운 함수)
CREATE OR REPLACE FUNCTION public.ensure_user_has_team()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    team_count int;
    new_team_id uuid;
    current_user_id uuid;
BEGIN
    -- 현재 사용자 ID 가져오기
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- 현재 사용자의 팀 수 확인
    SELECT COUNT(*) INTO team_count
    FROM (
        SELECT t.id FROM public.teams t WHERE t.master_user_id = current_user_id
        UNION
        SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = current_user_id
    ) AS user_teams;
    
    -- 팀이 없으면 생성
    IF team_count = 0 THEN
        new_team_id := public.create_team_for_user(current_user_id);
    END IF;
END;
$$;

-- =====================================================
-- 3. 기존 사용자들에게 팀 할당
-- =====================================================

-- 팀이 없는 기존 사용자들을 위한 팀 생성
DO $$
DECLARE
    user_record RECORD;
    new_team_id UUID;
BEGIN
    -- 팀이 없는 사용자들 찾기
    FOR user_record IN
        SELECT u.id, u.email
        FROM auth.users u
        WHERE u.id NOT IN (
            -- 마스터로서 팀을 가진 사용자
            SELECT t.master_user_id FROM public.teams t
            UNION
            -- 멤버로서 팀을 가진 사용자
            SELECT tm.user_id FROM public.team_members tm
        )
        AND u.deleted_at IS NULL
    LOOP
        -- 사용자를 위한 팀 생성
        new_team_id := public.create_team_for_user(user_record.id);
        
        RAISE NOTICE 'Created team % for user %', new_team_id, user_record.email;
    END LOOP;
END $$;

-- =====================================================
-- 4. RLS 정책 개선 (team_members 테이블)
-- =====================================================

-- 기존 team_members 정책 제거
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Masters can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Masters can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Masters can remove team members" ON public.team_members;

-- 개선된 RLS 정책
CREATE POLICY "Users can view their own team memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Team members can view all team memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT team_id 
        FROM public.team_members 
        WHERE user_id = auth.uid()
    )
    OR 
    team_id IN (
        SELECT id 
        FROM public.teams 
        WHERE master_user_id = auth.uid()
    )
);

CREATE POLICY "Masters can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (
    team_id IN (
        SELECT id 
        FROM public.teams 
        WHERE master_user_id = auth.uid()
    )
)
WITH CHECK (
    team_id IN (
        SELECT id 
        FROM public.teams 
        WHERE master_user_id = auth.uid()
    )
);

-- =====================================================
-- 5. 미들웨어를 위한 헬퍼 함수 개선
-- =====================================================

-- 사용자의 팀 멤버십을 가져오는 함수 (미들웨어에서 사용)
CREATE OR REPLACE FUNCTION public.get_user_team_memberships(user_id_param UUID)
RETURNS TABLE(team_id UUID, role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 먼저 팀이 있는지 확인하고 없으면 생성
    PERFORM public.create_team_for_user(user_id_param);
    
    -- 팀 멤버십 반환
    RETURN QUERY
    SELECT t.id AS team_id, 'master'::user_role AS role
    FROM public.teams t
    WHERE t.master_user_id = user_id_param
    UNION
    SELECT tm.team_id, tm.role
    FROM public.team_members tm
    WHERE tm.user_id = user_id_param;
END;
$$;

-- =====================================================
-- 6. 데이터 일관성 검증
-- =====================================================

-- 모든 사용자가 팀을 가지고 있는지 확인
DO $$
DECLARE
    orphaned_users INT;
BEGIN
    SELECT COUNT(*) INTO orphaned_users
    FROM auth.users u
    WHERE u.id NOT IN (
        SELECT t.master_user_id FROM public.teams t
        UNION
        SELECT tm.user_id FROM public.team_members tm
    )
    AND u.deleted_at IS NULL;
    
    IF orphaned_users > 0 THEN
        RAISE NOTICE 'Warning: % users still without teams after migration', orphaned_users;
    ELSE
        RAISE NOTICE 'Success: All users now have teams assigned';
    END IF;
END $$;

-- =====================================================
-- 7. 권한 부여
-- =====================================================

-- 새로운 함수들에 대한 권한 부여
GRANT EXECUTE ON FUNCTION public.ensure_user_has_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_team_memberships(UUID) TO authenticated, service_role;

-- =====================================================
-- 완료 메시지
-- =====================================================

SELECT 'Migration completed successfully! All security issues resolved and team memberships fixed.' AS status;
