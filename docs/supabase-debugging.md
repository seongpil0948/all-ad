# Supabase 서비스 테스트 및 디버깅 가이드 (Production/Staging)

이 문서는 로컬 환경이 아닌, Vercel에 배포되었거나 Supabase에 직접 배포된 프로덕션/스테이징 환경의 Supabase 서비스를 테스트하고 디버깅하는 방법을 안내합니다.

**주의:** 이 가이드의 모든 명령어는 실제 운영 데이터에 영향을 줄 수 있으므로 주의해서 사용해야 합니다. 테스트는 가급적 스테이징 환경에서 진행하는 것을 권장합니다.

## 사전 준비

- `curl` 또는 Postman과 같은 HTTP 클라이언트
- `psql` 또는 DBeaver, TablePlus와 같은 PostgreSQL 클라이언트
- 프로젝트 루트의 `.env.development.local` 파일에 있는 Supabase 관련 환경 변수

```env
# .env.development.local
NEXT_PUBLIC_SUPABASE_URL=https://dtttnnwrzbtjzjzmpvaf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DB_PW=...
```

---

## 1. Edge Functions

배포된 Edge Function은 HTTP 요청을 통해 직접 호출할 수 있습니다. 이를 통해 함수의 동작을 즉시 테스트하고 응답을 확인할 수 있습니다.

### 함수 호출 (Curl)

`curl`을 사용하여 터미널에서 직접 함수를 호출할 수 있습니다.

- `{FUNCTION_NAME}`: 테스트하려는 함수의 이름으로 변경합니다. (예: `google-ads-sync`)
- `{SUPABASE_URL}`: `.env.development.local`의 `NEXT_PUBLIC_SUPABASE_URL` 값입니다.
- `{ANON_KEY}`: `.env.development.local`의 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값입니다.
- `--data`: 함수에 전달할 JSON 페이로드입니다.

```bash
# .env.development.local 파일의 정보를 변수로 설정
SUPABASE_URL="https://dtttnnwrzbtjzjzmpvaf.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0dHRubndyemJ0anpqem1wdmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDEwMjYsImV4cCI6MjA2NDE3NzAyNn0.mO8C5D8GaqZvt4e_K6o-2O4viYyPt2tZfYYuaIPv8dI"
FUNCTION_NAME="google-ads-sync"

# 함수 호출
curl -X POST "${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  --data '{"test": true}'
```

**참고:** `service_role` 권한이 필요한 함수의 경우, `ANON_KEY` 대신 `SUPABASE_SERVICE_ROLE_KEY`를 사용해야 합니다.

### 로그 확인

Edge Function의 로그는 Supabase 대시보드에서 실시간으로 확인할 수 있습니다. 로컬 CLI 명령어(`npx supabase functions logs`)는 로컬 환경에만 해당되므로, 배포된 환경에서는 대시보드를 사용해야 합니다.

1.  [Supabase 프로젝트 대시보드](https://app.supabase.com/)에 접속합니다.
2.  왼쪽 메뉴에서 **Edge Functions**를 선택합니다.
3.  로그를 확인하려는 함수를 클릭합니다.
4.  하단의 **Logs** 탭에서 실시간 로그를 확인하거나 과거 로그를 조회할 수 있습니다.

---

## 2. PostgreSQL 데이터베이스

`psql`과 같은 데이터베이스 클라이언트를 사용하여 원격 데이터베이스에 직접 연결하고 쿼리를 실행할 수 있습니다.

### 데이터베이스 연결 (psql)

- `{DB_PASSWORD}`: `.env.development.local`의 `DB_PW` 값으로 변경합니다.
- `{PROJECT_REF}`: Supabase 프로젝트 URL의 `https://`와 `.supabase.co` 사이의 문자열입니다. (예: `dtttnnwrzbtjzjzmpvaf`)

```bash
# psql을 사용하여 원격 DB에 연결 (Connection Pooler 사용)
psql "postgresql://postgres.{PROJECT_REF}:{DB_PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

# 예시
psql "postgresql://postgres.dtttnnwrzbtjzjzmpvaf:dejdo9-pehnip-bywdEf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres"

# 직접 연결 (Connection Pooler 없이)
# psql "postgresql://postgres:{DB_PASSWORD}@db.{PROJECT_REF}.supabase.co:5432/postgres"
```

**참고:** Connection Pooler를 사용하는 것이 권장됩니다. 연결 수가 제한되어 있고, 여러 클라이언트가 동시에 접근할 때 더 안정적입니다.

연결 후에는 SQL 쿼리를 직접 실행하여 데이터를 조회하거나, RLS 정책이 올바르게 작동하는지 등을 테스트할 수 있습니다.

### 디버깅 쿼리 예시

```sql
-- 특정 테이블의 최근 10개 데이터 조회
SELECT * FROM public.campaigns ORDER BY created_at DESC LIMIT 10;

-- 특정 사용자의 프로필 확인
SELECT * FROM public.profiles WHERE id = '...';

-- 활성화된 RLS 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaigns';

-- 현재 연결된 사용자 및 권한 확인
SELECT current_user, current_role, session_user;

-- 테이블 크기 및 행 수 확인
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename;

-- 실행 중인 쿼리 모니터링
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### 연결 문제 해결

데이터베이스 연결 시 문제가 발생하는 경우:

```bash
# 1. 네트워크 연결 확인
ping aws-0-ap-northeast-2.pooler.supabase.com

# 2. 포트 연결 확인
telnet aws-0-ap-northeast-2.pooler.supabase.com 6543

# 3. SSL 연결 강제 (필요한 경우)
psql "postgresql://postgres.dtttnnwrzbtjzjzmpvaf:dejdo9-pehnip-bywdEf@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require"
```

---

## 3. pg_cron (Scheduled Jobs)

`pg_cron`으로 스케줄링된 작업은 본질적으로 특정 시간에 실행되는 SQL 쿼리입니다.

### 작업 테스트

스케줄링된 작업의 SQL 쿼리를 데이터베이스에 직접 연결하여 실행하면, 작업이 올바르게 동작하는지 즉시 테스트할 수 있습니다.

예를 들어, 매일 자정에 실행되는 작업이 있다면 해당 SQL 문을 `psql` 세션에서 직접 실행해봅니다.

### 실행 기록 및 디버깅

`pg_cron`은 작업 실행에 대한 상세한 로그를 `cron.job_run_details` 테이블에 기록합니다. 이 테이블을 조회하여 작업의 성공 여부, 실행 시간, 출력 메시지 등을 확인할 수 있습니다.

```sql
-- 최근 실행된 cron 작업 10개 조회
SELECT
    jobid,
    job_name,
    status,
    runid,
    start_time,
    end_time,
    (end_time - start_time) as duration,
    output
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- 특정 작업의 실패 기록만 조회
SELECT *
FROM cron.job_run_details
WHERE job_name = 'your-job-name' AND status = 'failed'
ORDER BY start_time DESC;
```

이 쿼리를 통해 어떤 작업이 실패했는지, 실패 시 어떤 메시지를 반환했는지 등을 파악하여 디버깅할 수 있습니다.

---

## 4. 실시간 로그 모니터링

### Supabase 대시보드를 통한 로그 확인

1. **실시간 로그 스트림**: [Supabase 대시보드](https://app.supabase.com/) > Settings > Logs
2. **SQL Editor**: 실시간 쿼리 실행 및 결과 확인
3. **API Logs**: REST API 호출 로그 확인

### 로그 필터링 및 검색

```sql
-- 특정 시간대의 오류 로그 검색
SELECT * FROM public.activity_logs
WHERE level = 'error'
AND created_at > NOW() - INTERVAL '1 hour';

-- 특정 사용자의 활동 로그
SELECT * FROM public.activity_logs
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;
```

---

## 5. API 호출 디버깅

### REST API 테스트

```bash
# 환경 변수 설정
SUPABASE_URL="https://dtttnnwrzbtjzjzmpvaf.supabase.co"
ANON_KEY="your-anon-key"
SERVICE_ROLE_KEY="your-service-role-key"

# 데이터 조회 (GET)
curl -X GET "${SUPABASE_URL}/rest/v1/campaigns?select=*" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "apikey: ${ANON_KEY}"

# 데이터 삽입 (POST)
curl -X POST "${SUPABASE_URL}/rest/v1/campaigns" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Campaign", "status": "active"}'

# RLS 정책 테스트 (특정 사용자로)
curl -X GET "${SUPABASE_URL}/rest/v1/campaigns?select=*" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "apikey: ${ANON_KEY}" \
  -H "X-User-ID: user-id-here"
```

### 응답 코드별 디버깅

- **200**: 성공
- **400**: 잘못된 요청 (JSON 형식 확인)
- **401**: 인증 실패 (토큰 확인)
- **403**: 권한 없음 (RLS 정책 확인)
- **404**: 리소스 없음 (URL 및 테이블명 확인)
- **500**: 서버 오류 (로그 확인 필요)

---

## 6. 성능 모니터링

### 데이터베이스 성능 확인

```sql
-- 느린 쿼리 확인
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 테이블별 통계
SELECT
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
WHERE schemaname = 'public';

-- 인덱스 사용률 확인
SELECT
    indexrelname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Edge Function 성능 모니터링

Edge Function의 성능은 대시보드에서 확인할 수 있습니다:

1. **실행 시간**: 평균/최대 실행 시간
2. **메모리 사용량**: 함수별 메모리 소비
3. **오류율**: 성공/실패 비율
4. **호출 빈도**: 시간대별 호출 패턴

---

## 7. 보안 및 접근 제어 테스트

### RLS 정책 테스트

```sql
-- 현재 사용자 컨텍스트에서 정책 확인
SET request.jwt.claims.sub = 'user-id-here';
SELECT * FROM public.campaigns; -- RLS 정책 적용된 결과

-- 정책 비활성화 후 테스트 (주의: 개발 환경에서만)
ALTER TABLE public.campaigns DISABLE ROW LEVEL SECURITY;
SELECT * FROM public.campaigns; -- 모든 데이터 표시
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
```

### 권한 확인

```sql
-- 테이블별 권한 확인
SELECT
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public';

-- 함수별 권한 확인
SELECT
    routine_name,
    grantee,
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public';
```

---

## 8. 문제 해결 체크리스트

### 연결 문제

- [ ] `.env.development.local` 파일의 값이 정확한가?
- [ ] 네트워크 연결이 안정적인가?
- [ ] 방화벽이 포트를 차단하고 있지 않은가?
- [ ] Connection Pooler 주소를 사용하고 있는가?

### Edge Function 문제

- [ ] 함수가 정상적으로 배포되었는가?
- [ ] 올바른 Authorization 헤더를 사용하고 있는가?
- [ ] 함수 내부 로그를 확인했는가?
- [ ] 타임아웃 설정이 적절한가?

### 데이터베이스 문제

- [ ] RLS 정책이 예상대로 작동하는가?
- [ ] 인덱스가 올바르게 설정되어 있는가?
- [ ] 쿼리 성능이 저하되지 않았는가?
- [ ] 테이블 권한이 올바르게 설정되어 있는가?

### API 문제

- [ ] API 키가 올바른가?
- [ ] 요청 형식이 정확한가?
- [ ] Rate Limiting에 걸리지 않았는가?
- [ ] CORS 설정이 올바른가?
