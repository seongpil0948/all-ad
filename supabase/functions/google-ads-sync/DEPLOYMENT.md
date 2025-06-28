# Google Ads Sync Edge Function - Deployment Guide

This Edge Function has been fixed and is ready for deployment. The boot error was caused by:

1. Outdated Deno dependencies
2. Incorrect data schema mapping
3. Missing error handling for Redis operations

## Fixed Issues

1. **Updated Dependencies**
   - Deno std library: `0.168.0` → `0.224.0`
   - Redis client: `redis@v0.31.0` → `@redis/client@1.6.0`
   - Supabase client: `2.50.0` → `2.45.0`

2. **Schema Corrections**
   - `developer_token` and `refresh_token` are now correctly read from the `data` field
   - Customer ID is extracted from the `account_id` field pattern
   - Added proper TypeScript types for all variables

3. **Improved Error Handling**
   - Added try-catch blocks for Redis operations
   - Function continues even if Redis fails (uses database fallback)
   - Better logging for debugging

## Deployment Options

### Option 1: Deploy via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Select `google-ads-sync` function
4. Click "Deploy" or "Update"

### Option 2: Deploy via CLI (requires authentication)

```bash
# First, login to Supabase
supabase login

# Link to your project
supabase link --project-ref dtttnnwrzbtjzjzmpvaf

# Deploy the function
supabase functions deploy google-ads-sync --no-verify-jwt
```

### Option 3: Manual Deployment

If you have access to the Supabase CLI with proper authentication:

```bash
# Set the access token (get from Supabase Dashboard)
export SUPABASE_ACCESS_TOKEN=your_access_token_here

# Deploy
supabase functions deploy google-ads-sync --project-ref dtttnnwrzbtjzjzmpvaf --no-verify-jwt
```

## Environment Variables Required

Make sure these are set in your Supabase project:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`

## Testing

After deployment, test the function:

```bash
curl -X POST https://dtttnnwrzbtjzjzmpvaf.supabase.co/functions/v1/google-ads-sync \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  --data '{"trigger":"manual-test"}'
```

## Cron Schedule

This function is designed to run hourly. Make sure the cron job is configured in your Supabase project.
