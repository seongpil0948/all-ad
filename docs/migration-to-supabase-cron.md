# Migration from Vercel Cron to Supabase Cron

## Overview

This document outlines the migration from Vercel Cron jobs to Supabase Cron jobs using pg_cron and Supabase Edge Functions.

## Migration Date

2025-06-21

## What Changed

### 1. Removed Vercel Cron API Routes

The following API routes have been removed:

- `/app/api/cron/refresh-tokens/route.ts`
- `/app/api/cron/google-ads-sync/route.ts`
- `/app/api/cron/google-ads-sync-full/route.ts`

### 2. Updated Supabase Edge Functions

The following Edge Functions now contain the full logic from the API routes:

#### `refresh-tokens` Function

- Path: `/supabase/functions/refresh-tokens/index.ts`
- Functionality:
  - Refreshes OAuth tokens for Google, Facebook, and Kakao platforms
  - Uses Redis for token caching with fallback to database
  - Marks credentials as inactive if refresh fails
  - Returns detailed results for each processed credential

#### `google-ads-sync` Function

- Path: `/supabase/functions/google-ads-sync/index.ts`
- Functionality:
  - Performs incremental sync for Google Ads accounts
  - Retrieves OAuth tokens from Redis/database
  - Automatically refreshes tokens if needed
  - Calls platform-sync endpoint for actual sync operation

#### `google-ads-sync-full` Function

- Path: `/supabase/functions/google-ads-sync-full/index.ts`
- Functionality:
  - Performs full sync for Google Ads accounts (last 30 days)
  - Updates last_full_sync timestamp after successful sync
  - Includes metrics sync count in results

### 3. Supabase Cron Jobs Configuration

The cron jobs are configured in `/supabase/migrations/20250621_create_cron_jobs.sql`:

```sql
-- Refresh OAuth tokens - runs every hour
SELECT cron.schedule(
  'refresh-oauth-tokens',
  '0 * * * *',
  -- Calls refresh-tokens Edge Function
);

-- Google Ads incremental sync - runs every hour
SELECT cron.schedule(
  'google-ads-sync-hourly',
  '0 * * * *',
  -- Calls google-ads-sync Edge Function
);

-- Google Ads full sync - runs daily at 2 AM
SELECT cron.schedule(
  'google-ads-sync-full-daily',
  '0 2 * * *',
  -- Calls google-ads-sync-full Edge Function
);
```

### 4. Updated GoogleAdsScheduler

- Updated comments to reflect Supabase Cron usage
- Modified `getSchedulerStatus()` to return Supabase cron job information

### 5. Vercel Configuration

- `vercel.json` now has empty crons array: `{ "crons": [] }`

## Benefits of Migration

1. **Centralized Infrastructure**: All cron jobs now run within Supabase infrastructure
2. **Better Monitoring**: Can query cron job status using SQL functions
3. **No External Dependencies**: Removes dependency on Vercel cron
4. **Consistent Authentication**: Uses Supabase service role key for all operations

## Monitoring Cron Jobs

Use these SQL functions to monitor cron job health:

```sql
-- Get status of all cron jobs
SELECT * FROM get_cron_job_status();

-- Check health of specific job
SELECT * FROM check_cron_job_health('refresh-oauth-tokens');
```

## Rollback Plan

If needed to rollback:

1. Restore the API route files from git history
2. Update vercel.json with cron configurations
3. Disable Supabase cron jobs using `cron.unschedule()`

## Notes

- All Edge Functions include proper error handling and logging
- Redis connection is optional - functions work without it
- Token refresh has 30-minute buffer before expiry
- Google Ads sync has 5-minute buffer for token refresh
