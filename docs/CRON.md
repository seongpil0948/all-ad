### 디버깅 및 문제 해결

#### 일반적인 문제와 해결 방법

##### 1. 작업이 실행되지 않는 경우

```sql
-- Check if job is active
SELECT * FROM cron.job WHERE jobname = 'your-job-name';

-- Check scheduler status
SELECT pid, application_name, state
FROM pg_stat_activity
WHERE application_name ILIKE '%cron%';
```

##### 2. 성능 문제

```sql
-- Monitor concurrent jobs
SELECT
    COUNT(*) as running_jobs,
    MAX(start_time) as oldest_job_start
FROM cron.job_run_details
WHERE status = 'running';

-- Check for long-running jobs
SELECT
    j.jobname,
    jrd.start_time,
    now() - jrd.start_time as duration
FROM cron.job j
JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE jrd.status = 'running'
    AND now() - jrd.start_time > interval '5 minutes';
```

##### 3. 오류 조사

```sql
-- Recent failures
SELECT
    j.jobname,
    jrd.return_message,
    jrd.start_time
FROM cron.job j
JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE jrd.status = 'failed'
    AND jrd.start_time > now() - interval '24 hours'
ORDER BY jrd.start_time DESC;
```

## 7. 모범 사례 요약

### 개발 프로세스

1. **모든 cron job 정의는 마이그레이션으로 관리** - 버전 관리와 재현성 보장
2. **로컬에서 빈번한 스케줄로 먼저 테스트** - 빠른 피드백 루프 구축
3. **적절한 오류 처리 및 로깅 구현** - 문제 발생 시 빠른 진단 가능

### 성능 최적화

4. **작업 실행 및 성능을 정기적으로 모니터링** - 병목 현상 조기 발견
5. **프로덕션에서 작업 실행 시간은 10분 이내로 유지** - 타임아웃 방지
6. **동시 작업 수를 8개로 제한** - 최적의 성능 보장

### 보안 및 관리

7. **민감한 데이터는 Supabase Vault 사용** - 보안 강화
8. **설명적인 작업 이름 사용 및 환경 접두사 포함** - 명확한 구분
9. **작업 실행 상세 정보 정리 구현** - 로그 테이블 관리
10. **작업 실패에 대한 알림 설정** - 즉각적인 대응 가능

### 환경별 분리 전략

#### 명명 규칙

```sql
-- Development environment
'dev_cleanup_sessions'
'test_daily_report'

-- Production environment
'prod_cleanup_sessions'
'prod_daily_report'
```

#### 환경 변수 활용

```sql
-- Use environment-specific configuration
DO $$
DECLARE
    env_prefix TEXT;
BEGIN
    -- Determine environment
    IF current_database() = 'postgres' THEN
        env_prefix := 'dev_';
    ELSE
        env_prefix := 'prod_';
    END IF;

    -- Create environment-specific job
    PERFORM cron.schedule(
        env_prefix || 'maintenance',
        '0 3 * * *',
        'CALL maintenance_procedure();'
    );
END $$;
```

## 결론

이 가이드는 Supabase에서 cron job을 효과적으로 관리하는 데 필요한 모든 정보를 제공합니다. 로컬 개발 환경 설정부터 프로덕션 배포까지 전체 프로세스를 다루었으며, 실용적인 예제와 모범 사례를 통해 실제 프로젝트에 즉시 적용할 수 있는 지식을 제공합니다.

핵심은 개발과 프로덕션 환경을 명확히 분리하고, 마이그레이션을 통해 버전 관리를 하며, 적절한 모니터링과 오류 처리를 구현하는 것입니다. 이를 통해 안정적이고 유지보수가 쉬운 cron job 시스템을 구축할 수 있습니다.

---

## 운영/로컬 상태 점검 결과 (2025-08-17 UTC)

아래 결과는 Supabase 프로젝트와 로컬 개발 DB를 직접 조회하여 확인한 최신 상태입니다.

### 운영(프로덕션) 환경

- 설치/상태
  - pg_cron 확장 설치됨, 스케줄러 프로세스 확인됨 (`pg_cron scheduler`).
  - 최근 48시간 기준 실패(failed) 실행 없음.
- 활성 Cron 목록 및 최근 실행
  - `test-cron-job` — 스케줄: `* * * * *` — 최근 실행: 07:47 UTC
  - `refresh-oauth-tokens` — 스케줄: `0 * * * *` — 최근 실행: 07:00 UTC
  - `google-ads-sync-hourly` — 스케줄: `30 * * * *` — 최근 실행: 07:30 UTC
  - `google-ads-sync-full-daily` — 스케줄: `0 2 * * *` — 최근 실행: 02:00 UTC
  - `cleanup-cron-history` — 스케줄: `0 3 * * 0` — 최근 실행: 03:00 UTC
- 토큰 리프레시(구글/메타) 상태
  - `refresh-oauth-tokens` 잡은 정상적으로 매시 0분에 트리거되고, `activity_logs`에 이벤트가 기록되고 있습니다.
  - 현재 `public.platform_credentials` 테이블의 총 레코드 수는 0으로 확인되어, 실제 리프레시 대상 자격증명이 없습니다. 자격증명이 추가되면 아래 "토큰 리프레시 점검 쿼리"로 만료 임박/오류 여부를 상시 점검할 수 있습니다.

참고: 위 요약은 다음 쿼리로 확인되었습니다.

```sql
-- 잡 목록 + 최근 실행
SELECT j.jobid, j.jobname, j.schedule, j.active,
             max(jrd.start_time) AS last_run,
             max(jrd.end_time)   AS last_end,
             max(CASE WHEN jrd.status = 'failed' THEN jrd.start_time END) AS last_failure
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
GROUP BY j.jobid, j.jobname, j.schedule, j.active
ORDER BY j.jobid;

-- 최근 실패
SELECT j.jobname, jrd.status, jrd.start_time, jrd.end_time, jrd.return_message
FROM cron.job j
JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
WHERE jrd.status = 'failed' AND jrd.start_time > now() - interval '24 hours'
ORDER BY jrd.start_time DESC;

-- 활동 로그(토큰 리프레시/동기화 기록)
SELECT created_at, action, details->>'message' AS message
FROM public.activity_logs
WHERE action IN ('refresh_tokens','sync_google_ads','sync_google_ads_full')
    AND created_at > now() - interval '48 hours'
ORDER BY created_at DESC;
```

### 로컬 개발 환경

- 설치/상태
  - Supabase 로컬 스택은 실행 중입니다.
  - `cron.job` 테이블 미존재 → 로컬 DB에 `pg_cron` 확장이 설치되지 않은 상태입니다.
- 조치 방법
  1. 로컬 DB에 `pg_cron` 설치
     ```sql
     -- 로컬 DB(postgres)에 접속 후 실행
     CREATE EXTENSION IF NOT EXISTS pg_cron;
     ```
  2. 프로젝트 마이그레이션 재적용 (pg_cron 포함)
     - 선택 1: 로컬 DB 리셋 시 마이그레이션/시드 자동 적용
       - `supabase db reset` (CLI)
     - 선택 2: 로컬 마이그레이션만 업
       - `npx supabase migration up --local --include-all`
  3. 설치 확인
     ```sql
     SELECT extname FROM pg_extension WHERE extname IN ('pg_cron','pg_net','pgcrypto');
     -- 기대: pg_cron, pg_net, pgcrypto 중 최소 pg_cron 표시
     ```

설치 후에는 아래 점검/모니터링 쿼리로 로컬에서도 상태를 동일하게 확인할 수 있습니다.

```sql
-- 스케줄러 프로세스
SELECT pid, application_name, state, backend_start
FROM pg_stat_activity
WHERE application_name ILIKE '%cron%'
ORDER BY backend_start DESC;

-- 잡/실행 요약
SELECT j.jobname, j.schedule, j.active,
             max(jrd.start_time) AS last_run,
             max(jrd.end_time)   AS last_end
FROM cron.job j
LEFT JOIN cron.job_run_details jrd ON j.jobid = jrd.jobid
GROUP BY j.jobname, j.schedule, j.active
ORDER BY j.jobname;
```

## 토큰 리프레시 점검 쿼리 (업데이트)

현재 스키마에는 `refreshed_at` 컬럼이 없으므로, 만료(`expires_at`) 및 갱신 추정(`updated_at`) 기준으로 점검합니다. 아래 쿼리들은 운영/로컬 공통으로 사용할 수 있습니다.

```sql
-- 1) 플랫폼별 자격증명 현황
SELECT platform,
             count(*)                       AS total,
             count(*) FILTER (WHERE is_active) AS active,
             count(*) FILTER (WHERE NOT is_active) AS inactive
FROM public.platform_credentials
GROUP BY platform
ORDER BY platform;

-- 2) 만료 임박(24시간 이내) 토큰
SELECT id, platform, account_id, is_active, expires_at,
             (expires_at - now()) AS time_to_expiry
FROM public.platform_credentials
WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now() + interval '24 hours'
ORDER BY expires_at ASC
LIMIT 100;

-- 3) 최근 갱신/오류 상태 파악
SELECT id, platform, account_id, updated_at, expires_at, error_message
FROM public.platform_credentials
ORDER BY updated_at DESC
LIMIT 100;

-- 4) 토큰 리프레시 잡이 주기적으로 실행되는지 활동 로그로 확인
SELECT created_at, details->>'credentials_count' AS credentials_count
FROM public.activity_logs
WHERE action = 'refresh_tokens'
    AND created_at > now() - interval '48 hours'
ORDER BY created_at DESC;
```

권장 운영 기준

- 리프레시 잡 주기: 60분 주기(또는 각 플랫폼의 권장 갱신 주기)에 맞춤
- 임계치 경보: `expires_at < now() + '24 hours'` 조건을 모니터링(예: 대시보드/경고 채널)
- 오류 파악: `error_message IS NOT NULL` 레코드 알림 및 재시도 정책 수립

## (옵션) 샘플 잡 정의 예시

플랫폼 토큰 리프레시용 잡은 보통 DB 함수 또는 Edge Function 호출 형태를 권장합니다. 아래는 참고용으로 활동 로그를 남기는 샘플입니다.

```sql
-- 매시 0분에 리프레시 트리거
SELECT cron.schedule(
    'prod_refresh_oauth_tokens',
    '0 * * * *',
    $$
    INSERT INTO public.activity_logs (
        action, entity_type, entity_id, performed_by, details, created_at
    ) VALUES (
        'refresh_tokens', 'system', 'oauth-refresh', '00000000-0000-0000-0000-000000000000'::uuid,
        jsonb_build_object(
            'message', 'OAuth token refresh triggered',
            'timestamp', now(),
            'credentials_count', (SELECT COUNT(*) FROM public.platform_credentials WHERE is_active = true)
        ),
        now()
    );
    $$
);
```

실서비스에서는 위 SQL 대신 안전하게 캡슐화된 프로시저(예: `CALL refresh_oauth_tokens();`) 또는 Edge Function HTTP 호출을 사용하고, 결과/오류를 `activity_logs` 혹은 전용 로그 테이블에 남기세요.

---

### 빠른 체크리스트 (요약)

- [운영] pg_cron 스케줄러 동작 확인됨, 최근 48시간 실패 없음, 잡 실행 주기 정상
- [운영] 플랫폼 자격증명 0건 → 리프레시 대상 없음 (자격증명 연동 후 재점검 필요)
- [로컬] pg_cron 미설치 → `CREATE EXTENSION pg_cron;` 후 마이그레이션 적용 필요
- [공통] 만료 임박/오류 점검 쿼리로 상시 헬스체크 권장
