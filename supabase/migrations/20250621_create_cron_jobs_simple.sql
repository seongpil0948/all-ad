-- Simple cron job setup without complex logic
-- Note: pg_cron and pg_net extensions must be enabled in Supabase dashboard

-- Schedule refresh tokens job - runs every hour
SELECT cron.schedule(
  'refresh-oauth-tokens',
  '0 * * * *',
  $$
  SELECT 1;  -- Placeholder - will be replaced with actual Edge Function call
  $$
);

-- Schedule Google Ads sync job - runs every hour  
SELECT cron.schedule(
  'google-ads-sync-hourly',
  '0 * * * *',
  $$
  SELECT 1;  -- Placeholder - will be replaced with actual Edge Function call
  $$
);

-- Schedule Google Ads full sync job - runs daily at 2 AM
SELECT cron.schedule(
  'google-ads-sync-full-daily', 
  '0 2 * * *',
  $$
  SELECT 1;  -- Placeholder - will be replaced with actual Edge Function call
  $$
);

-- Create a function to get cron job status
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
  RETURN QUERY
  SELECT 
    j.jobid,
    j.jobname,
    j.schedule,
    j.command,
    j.active,
    MAX(jr.start_time) as last_run,
    (SELECT status FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_status,
    (SELECT end_time - start_time FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_duration
  FROM cron.job j
  LEFT JOIN cron.job_run_details jr ON j.jobid = jr.jobid
  WHERE j.jobname IN ('refresh-oauth-tokens', 'google-ads-sync-hourly', 'google-ads-sync-full-daily')
  GROUP BY j.jobid, j.jobname, j.schedule, j.command, j.active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;