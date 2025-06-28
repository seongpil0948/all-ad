# Supabase Cron Jobs 배포 가이드

## 0. Supabase CLI 설치

```bash
# macOS/Linux
brew install supabase/tap/supabase

# npm
npm install -g supabase

# 로그인
supabase login
```

## 1. Edge Functions 배포

```bash
# 프로젝트 링크 (처음 한 번만)
supabase link --project-ref your-project-ref

# 배포 스크립트 실행
./supabase/functions/deploy.sh

# 또는 개별 함수 배포
supabase functions deploy refresh-tokens
supabase functions deploy google-ads-sync
supabase functions deploy google-ads-sync-full
supabase functions deploy oauth-refresh
supabase functions deploy platform-sync
```

## 2. 환경 변수 설정

Supabase 대시보드 > Edge Functions > 각 함수별로 설정:

```
REDIS_URL=your_redis_url
```

> **참고**: OAuth 클라이언트 ID와 시크릿은 이제 환경 변수가 아닌 `team_credentials` 테이블에서 직접 읽어옵니다.

## 3. Cron Jobs 확인

SQL 에디터에서 실행:

```sql
-- Cron job 상태 확인
SELECT * FROM cron.job;

-- 최근 실행 기록 확인
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

## 4. Cron Jobs 관리

### 수동 실행

```sql
-- 특정 job 수동 실행
SELECT cron.run_job((SELECT jobid FROM cron.job WHERE jobname = 'refresh-oauth-tokens'));
```

### 활성화/비활성화

```sql
-- 비활성화
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'refresh-oauth-tokens'),
  active := false
);

-- 활성화
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'refresh-oauth-tokens'),
  active := true
);
```

### 스케줄 변경

```sql
-- 스케줄 변경 (예: 30분마다 실행)
SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'refresh-oauth-tokens'),
  schedule := '*/30 * * * *'
);
```

## 5. 모니터링

### 관리자 페이지

`/admin/cron-jobs`에서 UI로 모니터링 가능

### 로그 확인

Supabase 대시보드 > Logs > Edge Functions에서 실행 로그 확인

## 6. 문제 해결

### Cron job이 실행되지 않는 경우

1. pg_cron extension이 활성화되어 있는지 확인
2. Edge Function이 정상적으로 배포되었는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인

### 에러 확인

```sql
-- 실패한 job 확인
SELECT * FROM cron.job_run_details
WHERE status != 'succeeded'
ORDER BY start_time DESC
LIMIT 10;
```

## 7. 주의사항

- Cron jobs는 UTC 시간 기준으로 실행됩니다
- Edge Functions는 최대 150초까지 실행 가능합니다
- 동시 실행 제한이 있으므로 장시간 실행되는 작업은 주의가 필요합니다
