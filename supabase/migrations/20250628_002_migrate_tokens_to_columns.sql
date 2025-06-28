-- =====================================================
-- Complete Migration: Move All Token Data to Top-Level Columns
-- =====================================================

-- Step 1: Ensure all existing token data is migrated from JSONB to columns
UPDATE public.platform_credentials
SET 
  access_token = COALESCE(
    access_token, 
    (data->>'access_token')::TEXT, 
    (credentials->>'access_token')::TEXT
  ),
  refresh_token = COALESCE(
    refresh_token,
    (data->>'refresh_token')::TEXT, 
    (credentials->>'refresh_token')::TEXT
  ),
  expires_at = COALESCE(
    expires_at,
    CASE 
      WHEN data->>'expires_at' IS NOT NULL THEN (data->>'expires_at')::TIMESTAMP WITH TIME ZONE
      WHEN credentials->>'expires_at' IS NOT NULL THEN (credentials->>'expires_at')::TIMESTAMP WITH TIME ZONE
      WHEN data->>'expiry_date' IS NOT NULL THEN to_timestamp((data->>'expiry_date')::BIGINT / 1000)
      ELSE NULL
    END
  ),
  scope = COALESCE(
    scope,
    (data->>'scope')::TEXT, 
    (credentials->>'scope')::TEXT
  )
WHERE platform IN ('google', 'facebook', 'kakao', 'naver');

-- Step 2: Clean up JSONB data - remove token fields but keep user info
UPDATE public.platform_credentials
SET 
  data = data - 'access_token' - 'refresh_token' - 'expires_at' - 'expiry_date' - 'token_type' - 'scope'
WHERE platform IN ('google', 'facebook', 'kakao', 'naver')
AND data IS NOT NULL;

-- Step 3: Clean up credentials JSONB - remove token fields but keep OAuth client credentials
UPDATE public.platform_credentials
SET 
  credentials = credentials - 'access_token' - 'refresh_token' - 'expires_at' - 'token_type' - 'scope'
WHERE platform IN ('google', 'facebook', 'kakao', 'naver')
AND credentials IS NOT NULL;

-- Step 4: Add check constraints to ensure data integrity
ALTER TABLE public.platform_credentials
ADD CONSTRAINT check_oauth_tokens CHECK (
  CASE 
    WHEN platform IN ('google', 'facebook', 'kakao') AND is_active = true 
    THEN access_token IS NOT NULL AND refresh_token IS NOT NULL
    ELSE true
  END
);

-- Step 5: Create function to validate token migration
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
  WHERE pc.platform IN ('google', 'facebook', 'kakao', 'naver')
  GROUP BY pc.platform
  ORDER BY pc.platform;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Run validation
SELECT * FROM validate_token_migration();

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_credentials_token_refresh 
ON public.platform_credentials(platform, is_active, expires_at) 
WHERE expires_at IS NOT NULL AND is_active = true;

-- Step 8: Add comment explaining the migration
COMMENT ON TABLE public.platform_credentials IS 
'Platform credentials table with OAuth tokens stored in top-level columns (access_token, refresh_token, expires_at, scope). 
The data JSONB column now only contains non-sensitive metadata like user_email, user_id, connected_at.
The credentials JSONB column contains OAuth client credentials (client_id, client_secret) when not using All-AD OAuth.';

-- Step 9: Update RLS policies to check token columns instead of JSONB
-- (Only if you have custom RLS policies that check token data)

-- Step 10: Log migration completion
DO $$
DECLARE
  migration_stats RECORD;
BEGIN
  FOR migration_stats IN SELECT * FROM validate_token_migration() LOOP
    RAISE NOTICE 'Platform %: Total=%, Migrated=%, Missing=%', 
      migration_stats.platform, 
      migration_stats.total_count, 
      migration_stats.migrated_count,
      migration_stats.missing_tokens;
  END LOOP;
  
  RAISE NOTICE 'Token migration completed at %', NOW();
END $$;