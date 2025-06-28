import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";
import log from "@/utils/logger";

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenUrl: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  expiry_date?: number;
  scope?: string;
}

interface UserInfo {
  id: string;
  email?: string;
}

async function exchangeCodeForTokens(
  code: string,
  config: OAuthConfig,
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

async function getUserInfo(accessToken: string): Promise<UserInfo> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user info");
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Check for OAuth errors first
  if (error) {
    log.error("Google Ads OAuth error:", { error });

    return NextResponse.redirect(
      `${baseUrl}/integrated?error=oauth_denied&platform=google`,
    );
  }

  if (!code || !state) {
    log.error("Missing code or state parameter");

    return NextResponse.redirect(
      `${baseUrl}/integrated?error=invalid_request&platform=google`,
    );
  }

  try {
    const supabase = await createClient();

    // Verify state parameter
    const { data: stateData, error: stateError } = await supabase
      .from("oauth_states")
      .select("user_id, team_id")
      .eq("state", state)
      .eq("platform", "google")
      .single();

    if (stateError || !stateData) {
      log.error("Invalid state parameter", { stateError });

      return NextResponse.redirect(
        `${baseUrl}/integrated?error=invalid_state&platform=google`,
      );
    }

    // Delete the used state
    await supabase.from("oauth_states").delete().eq("state", state);

    // Get OAuth config
    const oauthConfig = await getAllAdOAuthConfig("google");

    if (!oauthConfig) {
      throw new Error("OAuth configuration not found");
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, oauthConfig);

    // Get user info
    const userInfo = await getUserInfo(tokens.access_token);

    // Generate unique account ID for multi-account support
    const accountId = `google_${userInfo.id}_${Date.now()}`;

    // Check if this specific Google account is already connected
    const { data: existingCred } = await supabase
      .from("platform_credentials")
      .select("id")
      .eq("team_id", stateData.team_id)
      .eq("platform", "google")
      .eq("data->>user_id", userInfo.id)
      .single();

    const expiryDate =
      tokens.expiry_date || Date.now() + tokens.expires_in * 1000;
    const expiresAt = new Date(expiryDate).toISOString();

    const credentialData = {
      team_id: stateData.team_id,
      platform: "google" as const,
      account_id: accountId,
      account_name: userInfo.email || "Google Ads Account",
      is_active: true,
      credentials: {}, // Empty - using All-AD's OAuth
      // Store tokens as top-level columns only
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      // Minimal data for user info only
      data: {
        user_email: userInfo.email,
        user_id: userInfo.id,
        connected_at: new Date().toISOString(),
      },
      created_by: stateData.user_id,
      user_id: stateData.user_id,
    };

    if (existingCred) {
      // Update existing credential
      const { error: updateError } = await supabase
        .from("platform_credentials")
        .update(credentialData)
        .eq("id", existingCred.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new credential
      const { error: insertError } = await supabase
        .from("platform_credentials")
        .insert(credentialData);

      if (insertError) {
        throw insertError;
      }
    }

    // Try to get Google Ads customer ID after saving credentials
    try {
      const { getGoogleAdsCustomerId } = await import(
        "@/lib/google-ads/get-customer-id"
      );

      // Get the customer ID using the tokens
      const googleAdsCustomerId = await getGoogleAdsCustomerId(
        tokens.access_token,
        tokens.refresh_token || "",
      );

      if (googleAdsCustomerId) {
        log.info("Found Google Ads customer ID", {
          customerId: googleAdsCustomerId,
        });

        // Update the account_id with the actual customer ID
        const { error: updateError } = await supabase
          .from("platform_credentials")
          .update({
            account_id: googleAdsCustomerId,
            account_name: `Google Ads - ${googleAdsCustomerId}`,
          })
          .eq("team_id", stateData.team_id)
          .eq("platform", "google")
          .eq("data->>user_id", userInfo.id);

        if (updateError) {
          log.error("Failed to update customer ID", updateError);
        }
      }
    } catch (error) {
      log.error("Failed to get Google Ads customer ID", error as Error);
      // Continue anyway - the sync will fail but at least OAuth is connected
    }

    log.info("Google Ads OAuth completed successfully", {
      teamId: stateData.team_id,
      userId: stateData.user_id,
      accountId,
      userEmail: userInfo.email,
    });

    return NextResponse.redirect(
      `${baseUrl}/integrated?success=google_connected&tab=platforms`,
    );
  } catch (error) {
    log.error("Failed to process Google Ads OAuth callback:", error);

    return NextResponse.redirect(
      `${baseUrl}/integrated?error=oauth_failed&platform=google`,
    );
  }
}
