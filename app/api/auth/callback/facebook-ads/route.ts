import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { OAuthManager } from "@/lib/oauth/oauth-manager";
import { getOAuthConfigWithCredentials } from "@/lib/oauth/platform-configs";
import { Logger } from "@/utils/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    Logger.error("Facebook Ads OAuth error:", { error });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=oauth_denied`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=invalid_callback`,
    );
  }

  try {
    // Verify state and get user info
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=unauthorized`,
      );
    }

    // Decode state to get account info
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());

    if (stateData.userId !== user.id) {
      throw new Error("State mismatch");
    }

    // Get OAuth config with team's stored credentials
    const oauthConfig = await getOAuthConfigWithCredentials(
      "facebook",
      stateData.teamId,
    );

    if (!oauthConfig) {
      throw new Error("OAuth credentials not found for this team");
    }

    // Exchange code for tokens
    const oauthManager = new OAuthManager("facebook", oauthConfig);
    const tokenData = await oauthManager.exchangeCodeForTokens(code);

    // Get ad accounts from Facebook API
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${tokenData.access_token}`,
    );

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch Facebook ad accounts");
    }

    const { data: adAccounts } = await accountsResponse.json();
    const primaryAccount = adAccounts[0]; // Use first account or let user select

    if (!primaryAccount) {
      throw new Error("No Facebook ad account found");
    }

    // Find the pending credential record and update it
    const { data: pendingCreds } = await supabase
      .from("platform_credentials")
      .select("id, account_id, data")
      .eq("team_id", stateData.teamId)
      .eq("platform", "facebook")
      .ilike("account_id", "facebook_pending_%")
      .single();

    if (pendingCreds) {
      // Update the pending credential with actual account information
      const { error: updateError } = await supabase
        .from("platform_credentials")
        .update({
          account_id: primaryAccount.id,
          account_name: primaryAccount.name || "Facebook Ads Account",
          data: {
            ...pendingCreds.data,
            account_status: primaryAccount.account_status,
            connected: true,
            connected_at: new Date().toISOString(),
          },
          is_active: true,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", pendingCreds.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      throw new Error("No pending credentials found");
    }

    // Store tokens in Redis
    await oauthManager.storeTokens(user.id, primaryAccount.id, tokenData);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=facebook_connected`,
    );
  } catch (error) {
    Logger.error("Facebook Ads OAuth callback error:", error as Error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=oauth_failed`,
    );
  }
}
