-- =====================================================
-- Fix Cron Jobs to Call Edge Functions Properly
-- =====================================================

-- First, unschedule existing placeholder jobs
SELECT cron.unschedule('refresh-oauth-tokens');
SELECT cron.unschedule('google-ads-sync-hourly');
SELECT cron.unschedule('google-ads-sync-full-daily');

-- Create function to call Edge Functions via pg_net
CREATE OR REPLACE FUNCTION call_edge_function(function_name text, payload jsonb DEFAULT '{}')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
  service_role_key text;
  supabase_url text;
BEGIN
  -- Get service role key from vault
  SELECT decrypted_secret INTO service_role_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'service_role_key';
  
  -- Get Supabase URL
  supabase_url := current_setting('app.supabase_url', true);
  
  -- Make HTTP request to Edge Function
  SELECT net.http_post(
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

-- Schedule refresh tokens job - runs every hour
SELECT cron.schedule(
  'refresh-oauth-tokens',
  '0 * * * *',
  $$
  SELECT call_edge_function('refresh-oauth-tokens', '{"source": "cron"}');
  $$
);

-- Schedule Google Ads sync job - runs every hour  
SELECT cron.schedule(
  'google-ads-sync-hourly',
  '10 * * * *',
  $$
  SELECT call_edge_function('google-ads-sync', '{"mode": "hourly", "source": "cron"}');
  $$
);

-- Schedule Google Ads full sync job - runs daily at 2 AM
SELECT cron.schedule(
  'google-ads-sync-full-daily', 
  '0 2 * * *',
  $$
  SELECT call_edge_function('google-ads-sync-full', '{"mode": "daily", "source": "cron"}');
  $$
);

-- Create updated Edge Function for token refresh that uses proper column structure
CREATE OR REPLACE FUNCTION refresh_oauth_tokens_v2()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cred record;
  new_access_token text;
  new_refresh_token text;
  new_expires_at timestamptz;
BEGIN
  -- Get all credentials that need refresh (expire within 30 minutes)
  FOR cred IN 
    SELECT * FROM platform_credentials
    WHERE is_active = true
    AND platform IN ('google', 'facebook', 'kakao')
    AND expires_at IS NOT NULL
    AND expires_at < (NOW() + INTERVAL '30 minutes')
  LOOP
    -- Log refresh attempt
    RAISE NOTICE 'Refreshing token for % account %', cred.platform, cred.account_id;
    
    -- For now, mark as needing manual refresh
    -- In production, this would call the actual OAuth providers
    UPDATE platform_credentials
    SET 
      data = jsonb_set(
        COALESCE(data, '{}'::jsonb),
        '{needs_refresh}',
        'true'::jsonb
      ),
      updated_at = NOW()
    WHERE id = cred.id;
  END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION call_edge_function TO postgres;
GRANT EXECUTE ON FUNCTION refresh_oauth_tokens_v2 TO postgres;

-- Add comment explaining the setup
COMMENT ON FUNCTION call_edge_function IS 'Helper function to call Supabase Edge Functions from pg_cron jobs';
COMMENT ON FUNCTION refresh_oauth_tokens_v2 IS 'Temporary function to identify tokens needing refresh until Edge Function is fixed';