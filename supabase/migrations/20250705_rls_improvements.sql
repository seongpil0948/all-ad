-- =====================================================
-- RLS 정책 개선 및 팀 자동 생성 함수
-- 생성일: 2025-07-05
-- 설명: 406 에러 방지 및 자동 팀 생성 로직 추가
-- =====================================================

-- 기존 team_members 정책 제거
DROP POLICY IF EXISTS "Users can view their team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team memberships" ON public.team_members;
DROP POLICY IF EXISTS "Masters can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Masters can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Masters can remove team members" ON public.team_members;

-- 더 유연한 RLS 정책 추가
CREATE POLICY "Users can view their own team memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Team masters can view all team memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (
    team_id IN (
        SELECT id 
        FROM public.teams 
        WHERE master_user_id = auth.uid()
    )
);

CREATE POLICY "Service role can manage team members"
ON public.team_members
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Team masters can manage team members"
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

-- Teams 테이블에도 service_role 정책 추가
CREATE POLICY "Service role can manage teams"
ON public.teams
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 사용자가 팀을 가지도록 보장하는 함수 (API에서 사용)
CREATE OR REPLACE FUNCTION public.ensure_user_team(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    existing_team_id UUID;
    new_team_id UUID;
    user_email TEXT;
BEGIN
    -- 마스터로서 팀이 있는지 확인
    SELECT t.id INTO existing_team_id
    FROM public.teams t
    WHERE t.master_user_id = user_id
    LIMIT 1;
    
    IF existing_team_id IS NOT NULL THEN
        RETURN existing_team_id;
    END IF;
    
    -- 팀 멤버인지 확인
    SELECT tm.team_id INTO existing_team_id
    FROM public.team_members tm
    WHERE tm.user_id = user_id
    LIMIT 1;
    
    IF existing_team_id IS NOT NULL THEN
        RETURN existing_team_id;
    END IF;
    
    -- 팀이 없으면 생성
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    INSERT INTO public.teams (name, master_user_id)
    VALUES (COALESCE(user_email, 'My Team'), user_id)
    RETURNING id INTO new_team_id;
    
    -- 팀 멤버 테이블에도 추가 (일관성을 위해)
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, user_id, 'master')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    RETURN new_team_id;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.ensure_user_team(UUID) TO authenticated, service_role;

-- 완료 메시지
SELECT 'RLS policies updated and team creation function added' AS status;
