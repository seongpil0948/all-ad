-- =====================================================
-- 자동 팀 생성 및 멤버십 관리 개선
-- 생성일: 2025-07-05  
-- 설명: 새 사용자 가입 시 자동으로 팀과 team_members 레코드 생성
-- =====================================================

-- =====================================================
-- 1. 기존 트리거 제거 및 새로운 트리거 생성
-- =====================================================

-- 기존 트리거 제거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- handle_new_user 함수 개선
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    new_team_id uuid;
    invitation_token text;
BEGIN
    -- 프로필 생성
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    
    -- 초대 토큰이 있는지 확인
    invitation_token := NEW.raw_user_meta_data->>'invitation_token';
    
    IF invitation_token IS NOT NULL THEN
        -- 초대를 통한 가입인 경우 accept_team_invitation 함수 호출
        PERFORM public.accept_team_invitation(invitation_token);
        
        -- 초대를 수락했으면 팀이 있을 것이므로 추가 팀 생성 불필요
        RETURN NEW;
    END IF;
    
    -- 일반 가입인 경우 팀 생성
    new_team_id := public.create_team_for_user(NEW.id);
    
    -- 로그 정보
    RAISE NOTICE 'Created team % for new user %', new_team_id, NEW.email;
    
    RETURN NEW;
END;
$$;

-- 새로운 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. create_team_for_user 함수 개선 (team_members 레코드 생성 포함)
-- =====================================================

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
    -- 이미 team_members에 있는지 확인
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
        -- 기존 팀이 있으면 team_members에도 추가 (일관성 보장)
        INSERT INTO public.team_members (team_id, user_id, role)
        VALUES (new_team_id, create_team_for_user.user_id, 'master')
        ON CONFLICT (team_id, user_id) DO NOTHING;
        
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
    
    -- 사용자를 마스터로 team_members에 추가
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, create_team_for_user.user_id, 'master')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    RETURN new_team_id;
END;
$$;

-- =====================================================
-- 3. accept_team_invitation 함수 개선
-- =====================================================

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
  -- 현재 사용자 가져오기 (트리거에서 호출될 때는 직접 사용자 확인)
  v_user_id := auth.uid();
  
  -- 트리거에서 호출된 경우 uid()가 null일 수 있음
  IF v_user_id IS NULL THEN
    -- 초대 이메일로 사용자 찾기
    SELECT u.id INTO v_user_id
    FROM auth.users u
    JOIN public.team_invitations ti ON ti.email = u.email
    WHERE ti.token = invitation_token
    AND ti.status = 'pending'
    AND ti.expires_at > now()
    LIMIT 1;
  END IF;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found or not authenticated');
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

-- =====================================================
-- 4. team_members 테이블에 고유 제약조건 추가 (중복 방지)
-- =====================================================

-- 기존 중복 제거
DELETE FROM public.team_members 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.team_members 
    GROUP BY team_id, user_id
);

-- 고유 제약조건 추가
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_team_user_unique 
UNIQUE (team_id, user_id);

-- =====================================================
-- 5. 기존 사용자들의 team_members 레코드 생성
-- =====================================================

-- 마스터이지만 team_members에 없는 사용자들 추가
INSERT INTO public.team_members (team_id, user_id, role)
SELECT t.id, t.master_user_id, 'master'::user_role
FROM public.teams t
WHERE NOT EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = t.id AND tm.user_id = t.master_user_id
)
ON CONFLICT (team_id, user_id) DO NOTHING;

-- =====================================================
-- 6. 데이터 일관성 검증
-- =====================================================

-- 모든 팀 마스터가 team_members에 있는지 확인
DO $$
DECLARE
    missing_masters INT;
BEGIN
    SELECT COUNT(*) INTO missing_masters
    FROM public.teams t
    WHERE NOT EXISTS (
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = t.id AND tm.user_id = t.master_user_id
    );
    
    IF missing_masters > 0 THEN
        RAISE NOTICE 'Warning: % team masters not in team_members table', missing_masters;
    ELSE
        RAISE NOTICE 'Success: All team masters are in team_members table';
    END IF;
END $$;

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
        RAISE NOTICE 'Warning: % users still without teams', orphaned_users;
    ELSE
        RAISE NOTICE 'Success: All users have teams assigned';
    END IF;
END $$;

-- =====================================================
-- 완료 메시지
-- =====================================================

SELECT 'Team auto-creation migration completed successfully!' AS status;
