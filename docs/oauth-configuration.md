# OAuth Configuration Guide

This guide explains how to configure OAuth for Google Ads, Facebook Ads, and Kakao Ads in the Sivera platform.

## Overview

Sivera supports two methods for connecting advertising platforms:

1. **OAuth Flow** (Recommended): Users provide their OAuth app credentials, and we handle token management automatically
2. **Manual Token Input** (Fallback): Users can manually input refresh tokens if OAuth fails

## Google Ads Configuration

### Prerequisites

1. Google Ads Developer Token
2. Google Cloud Project with Google Ads API enabled
3. OAuth 2.0 Client ID credentials

### Setup Steps

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add the following redirect URI:
     ```
     http://localhost:3000/api/auth/callback/google-ads  # For development
     https://your-domain.com/api/auth/callback/google-ads  # For production
     ```

2. **Enable Google Ads API**
   - In Google Cloud Console, go to APIs & Services > Library
   - Search for "Google Ads API" and enable it

3. **Get Developer Token**
   - Visit [Google Ads API Center](https://ads.google.com/aw/apicenter)
   - Apply for a developer token if you don't have one

4. **Connect in Sivera**
   - Go to Settings > Platform Credentials
   - Click "Connect" for Google
   - Enter your Client ID, Client Secret, and Developer Token
   - (Optional) If OAuth fails, you can enter a manual refresh token

### Manual Token Generation (Fallback)

If OAuth fails, you can generate a refresh token manually:

1. Use the [OAuth Playground](https://developers.google.com/oauthplayground/)
2. Configure it to use your OAuth credentials
3. Authorize the Google Ads API scope: `https://www.googleapis.com/auth/adwords`
4. Exchange authorization code for tokens
5. Copy the refresh token and paste it in the "Refresh Token (Optional)" field

## Facebook Ads Configuration

### Prerequisites

1. Facebook App with Marketing API access
2. Facebook Business Account

### Setup Steps

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Create a new app (Business type)
   - Add Marketing API product

2. **Configure OAuth Settings**
   - In your app settings, go to Facebook Login > Settings
   - Add the following redirect URI:
     ```
     http://localhost:3000/api/auth/callback/facebook-ads  # For development
     https://your-domain.com/api/auth/callback/facebook-ads  # For production
     ```

3. **Connect in Sivera**
   - Go to Settings > Platform Credentials
   - Click "Connect" for Facebook
   - Enter your App ID and App Secret
   - (Optional) If OAuth fails, you can enter a manual access token

### Manual Token Generation (Fallback)

If OAuth fails, you can generate an access token manually:

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Add required permissions: `ads_read`, `ads_management`
4. Generate access token
5. Copy the token and paste it in the "Access Token (Optional)" field

## Kakao Ads Configuration

### Prerequisites

1. Kakao Business Account
2. Kakao Moment API access (requires approval)

### Setup Steps

1. **Create Kakao App**
   - Go to [Kakao Developers](https://developers.kakao.com)
   - Create a new application
   - Enable Kakao Login

2. **Configure OAuth Settings**
   - In app settings, go to Platform > Web
   - Add your domain
   - In Kakao Login > Redirect URI, add:
     ```
     http://localhost:3000/api/auth/callback/kakao-ads  # For development
     https://your-domain.com/api/auth/callback/kakao-ads  # For production
     ```

3. **Enable Client Secret**
   - Go to Security settings
   - Generate and enable Client Secret

4. **Connect in Sivera**
   - Go to Settings > Platform Credentials
   - Click "Connect" for Kakao
   - Enter your REST API Key and Client Secret
   - (Optional) If OAuth fails, you can enter a manual refresh token

## Common Issues and Solutions

### redirect_uri_mismatch Error

This error occurs when the redirect URI in your OAuth app doesn't match the one used by Sivera.

**Solution:**

1. Check the exact redirect URI shown in the error message
2. Add this exact URI to your OAuth app settings
3. Make sure there are no trailing slashes or protocol mismatches

### Invalid Client Error

This error occurs when the client ID or secret is incorrect.

**Solution:**

1. Double-check your client ID and secret
2. Make sure you're using the correct app/project
3. Regenerate credentials if necessary

### Token Refresh Failures

If automatic token refresh fails, the platform credential will be marked as inactive.

**Solution:**

1. Check the Supabase logs for specific error messages
2. Verify that the refresh token hasn't been revoked
3. Re-authenticate through the OAuth flow
4. As a last resort, use manual token input

## Security Best Practices

1. **Never share your OAuth credentials** - Each team should use their own OAuth app
2. **Use separate apps for development and production**
3. **Regularly rotate client secrets**
4. **Monitor OAuth app usage** for unusual activity
5. **Limit OAuth scopes** to only what's necessary

## Token Storage

All tokens are stored securely:

- Access tokens and refresh tokens are stored in Redis
- OAuth credentials (client_id, client_secret) are stored encrypted in PostgreSQL
- Tokens are automatically refreshed 30 minutes before expiry
- Manual tokens have a 1-year expiry and must be updated manually

## API Rate Limits

Be aware of platform-specific rate limits:

- **Google Ads**: 15,000 requests per day
- **Facebook**: 200 calls per hour per user
- **Kakao**: 5-second intervals for reports

The automatic token refresh runs hourly and shouldn't impact your rate limits.
