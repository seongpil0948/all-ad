-- =====================================================
-- Campaign Metrics RLS 정책 수정
-- =====================================================

-- 기존 정책 제거 (있을 경우)
DROP POLICY IF EXISTS "Team members can view campaign metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Team members can insert campaign metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Team members can update campaign metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Team members can delete campaign metrics" ON public.campaign_metrics;
DROP POLICY IF EXISTS "Service role can manage campaign metrics" ON public.campaign_metrics;

-- 1. 팀 멤버가 캠페인 메트릭을 볼 수 있는 정책
CREATE POLICY "Team members can view campaign metrics" 
ON public.campaign_metrics
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
    AND c.team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  )
);

-- 2. 팀 멤버가 캠페인 메트릭을 추가할 수 있는 정책
CREATE POLICY "Team members can insert campaign metrics" 
ON public.campaign_metrics
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
    AND c.team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  )
);

-- 3. 팀 멤버가 캠페인 메트릭을 수정할 수 있는 정책
CREATE POLICY "Team members can update campaign metrics" 
ON public.campaign_metrics
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
    AND c.team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
    AND c.team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  )
);

-- 4. 팀 멤버가 캠페인 메트릭을 삭제할 수 있는 정책
CREATE POLICY "Team members can delete campaign metrics" 
ON public.campaign_metrics
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_metrics.campaign_id
    AND c.team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
  )
);

-- 5. 서비스 역할은 모든 작업 가능 (Edge Functions, Cron jobs 등을 위해)
CREATE POLICY "Service role can manage campaign metrics" 
ON public.campaign_metrics
FOR ALL 
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 추가 확인사항: Sync Logs RLS 정책도 수정
-- =====================================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Users can view their team sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "System can manage sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Team members can view sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Service role can manage sync logs" ON public.sync_logs;

-- 수정된 정책
CREATE POLICY "Team members can view sync logs" 
ON public.sync_logs
FOR SELECT 
USING (
  team_id IN (SELECT team_id FROM public.user_teams(auth.uid()))
);

CREATE POLICY "Service role can manage sync logs" 
ON public.sync_logs
FOR ALL 
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 현재 정책 상태 확인 쿼리
-- =====================================================

-- 이 쿼리를 실행하여 정책이 제대로 적용되었는지 확인하세요:
/*
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('campaign_metrics', 'sync_logs')
ORDER BY tablename, policyname;
*/

-- =====================================================
-- 디버깅용: 현재 사용자의 팀 확인
-- =====================================================

-- 현재 사용자가 속한 팀을 확인하려면:
/*
SELECT * FROM public.user_teams(auth.uid());
*/

-- 캠페인이 올바른 팀에 속해있는지 확인:
/*
SELECT 
  c.id,
  c.name,
  c.team_id,
  c.platform,
  t.name as team_name
FROM public.campaigns c
JOIN public.teams t ON c.team_id = t.id
WHERE c.team_id IN (SELECT team_id FROM public.user_teams(auth.uid()));
*/