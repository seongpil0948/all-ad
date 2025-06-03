-- Create a cron job to refresh OAuth tokens every hour
-- This requires the pg_cron extension to be enabled in Supabase

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create the cron job to call our Edge Function every hour
SELECT cron.schedule(
  'refresh-oauth-tokens', -- job name
  '0 * * * *', -- cron expression: every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url')::text || '/functions/v1/refresh-oauth-tokens',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')::text,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Note: You'll need to set these in your Supabase dashboard:
-- 1. Go to Settings > Edge Functions
-- 2. Deploy the refresh-oauth-tokens function
-- 3. The cron job will automatically call it every hour

-- To check the status of cron jobs:
-- SELECT * FROM cron.job;

-- To check the execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;