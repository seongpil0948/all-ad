-- =====================================================
-- CRON JOBS AND EDGE FUNCTIONS
-- Add cron-related helper functions for local development
-- =====================================================

-- Cron 작업 상태 가져오기 함수 (pg_cron이 없어도 작동)
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean,
  last_run timestamptz,
  last_status text,
  last_duration interval
) AS $$
BEGIN
  -- Return empty results in local environment (no pg_cron)
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_net을 통한 Edge Function 호출 함수 (로컬 환경 호환)
CREATE OR REPLACE FUNCTION call_edge_function(function_name text, payload jsonb DEFAULT '{}')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- 로컬 환경에서는 Edge Function 호출을 시뮬레이션
  raise notice 'Edge Function call simulated: % with payload: %', function_name, payload;
  return 1; -- 시뮬레이션된 request_id
END;
$$;

-- 토큰 마이그레이션 검증 함수
CREATE OR REPLACE FUNCTION validate_token_migration()
RETURNS TABLE(
  platform TEXT,
  total_count BIGINT,
  migrated_count BIGINT,
  missing_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pc.platform::TEXT,
    COUNT(*)::BIGINT as total_count,
    COUNT(CASE WHEN pc.access_token IS NOT NULL THEN 1 END)::BIGINT as migrated_count,
    COUNT(CASE WHEN pc.access_token IS NULL AND pc.is_active = true THEN 1 END)::BIGINT as missing_tokens
  FROM platform_credentials pc
  WHERE pc.platform IN ('google', 'facebook', 'kakao', 'naver', 'amazon', 'tiktok')
  GROUP BY pc.platform
  ORDER BY pc.platform;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADDITIONAL PERMISSIONS FOR CRON FUNCTIONS
-- =====================================================

-- Grant permissions on cron-related functions
GRANT EXECUTE ON FUNCTION call_edge_function TO postgres;
GRANT EXECUTE ON FUNCTION get_cron_job_status TO postgres, service_role;
GRANT EXECUTE ON FUNCTION validate_token_migration TO authenticated, service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION call_edge_function IS 'Edge Functions 호출 헬퍼 함수 (로컬 환경에서는 시뮬레이션)';
COMMENT ON FUNCTION get_cron_job_status IS 'Cron 작업 상태 확인 함수 (로컬 환경 호환)';
COMMENT ON FUNCTION validate_token_migration IS 'OAuth 토큰 마이그레이션 상태를 검증하는 함수';

SELECT 'Cron helper functions created successfully for local development' as message;