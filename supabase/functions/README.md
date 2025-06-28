# Supabase Edge Functions

This directory contains Supabase Edge Functions that replace the previous Vercel Cron jobs.

## Functions

1. **refresh-tokens** - Refreshes OAuth tokens before they expire
2. **google-ads-sync** - Performs incremental sync of Google Ads campaigns
3. **google-ads-sync-full** - Performs full sync of Google Ads data
4. **oauth-refresh** - Helper function for OAuth token refresh
5. **platform-sync** - Generic platform sync handler

## Development

Edge Functions are written in TypeScript and run on Deno. The TypeScript errors shown in VS Code are normal because these files run in a Deno environment, not Node.js.

## Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy a specific function
supabase functions deploy refresh-tokens
```

## Environment Variables

Set these in your Supabase dashboard:

- `REDIS_URL` - Redis connection URL
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `FACEBOOK_APP_ID` - Facebook app ID
- `FACEBOOK_APP_SECRET` - Facebook app secret
- `KAKAO_CLIENT_ID` - Kakao client ID
- `KAKAO_CLIENT_SECRET` - Kakao client secret

## Testing

You can test functions locally using:

```bash
supabase functions serve refresh-tokens --env-file .env.local
```

Then make a request to: `http://localhost:54321/functions/v1/refresh-tokens`
