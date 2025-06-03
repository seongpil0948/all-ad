import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { OAuthManager } from "@/lib/oauth/oauth-manager";
import { getOAuthConfigWithCredentials } from "@/lib/oauth/platform-configs";
import log from "@/utils/logger";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    log.error("Kakao Ads OAuth error:", { error });

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
      "kakao",
      stateData.teamId,
    );

    if (!oauthConfig) {
      throw new Error("OAuth credentials not found for this team");
    }

    // Exchange code for tokens
    const oauthManager = new OAuthManager("kakao", oauthConfig);
    const tokenData = await oauthManager.exchangeCodeForTokens(code);

    // Get ad accounts from Kakao Moment API
    const accountsResponse = await fetch(
      "https://apis.moment.kakao.com/openapi/v4/adAccounts",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch Kakao ad accounts");
    }

    const { content: adAccounts } = await accountsResponse.json();
    const primaryAccount = adAccounts[0]; // Use first account or let user select

    if (!primaryAccount) {
      throw new Error("No Kakao ad account found");
    }

    // Find the pending credential record and update it
    const { data: pendingCreds } = await supabase
      .from("platform_credentials")
      .select("id, account_id, data")
      .eq("team_id", stateData.teamId)
      .eq("platform", "kakao")
      .ilike("account_id", "kakao_pending_%")
      .single();

    if (pendingCreds) {
      // Update the pending credential with actual account information
      const { error: updateError } = await supabase
        .from("platform_credentials")
        .update({
          account_id: primaryAccount.id,
          account_name: primaryAccount.name || "Kakao Moment Account",
          data: {
            ...pendingCreds.data,
            business_type: primaryAccount.businessType,
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
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=kakao_connected`,
    );
  } catch (error) {
    log.error("Kakao Ads OAuth callback error:", error as Error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=oauth_failed`,
    );
  }
}
