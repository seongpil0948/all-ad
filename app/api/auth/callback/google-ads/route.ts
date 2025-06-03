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
    Logger.error("Google Ads OAuth error:", { error });

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
      "google",
      stateData.teamId,
    );

    if (!oauthConfig) {
      throw new Error("OAuth credentials not found for this team");
    }

    // Exchange code for tokens
    const oauthManager = new OAuthManager("google", oauthConfig);
    const tokenData = await oauthManager.exchangeCodeForTokens(code);

    // Get developer token from stored credentials
    const { data: credentialData } = await supabase
      .from("platform_credentials")
      .select("data")
      .eq("team_id", stateData.teamId)
      .eq("platform", "google")
      .single();

    const developerToken = credentialData?.data?.developer_token || "";

    // Get customer ID from Google Ads API using the access token
    const customerResponse = await fetch(
      "https://googleads.googleapis.com/v14/customers:listAccessibleCustomers",
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "developer-token": developerToken,
        },
      },
    );

    if (!customerResponse.ok) {
      throw new Error("Failed to fetch Google Ads accounts");
    }

    const { resourceNames } = await customerResponse.json();
    const customerId = resourceNames[0]?.split("/")[1]; // Extract customer ID

    if (!customerId) {
      throw new Error("No Google Ads account found");
    }

    // Find the pending credential record and update it
    const { data: pendingCreds } = await supabase
      .from("platform_credentials")
      .select("id, account_id")
      .eq("team_id", stateData.teamId)
      .eq("platform", "google")
      .ilike("account_id", "google_pending_%")
      .single();

    if (pendingCreds) {
      // Update the pending credential with actual account information
      const { error: updateError } = await supabase
        .from("platform_credentials")
        .update({
          account_id: customerId,
          account_name: stateData.accountName || "Google Ads Account",
          data: {
            ...credentialData?.data,
            customer_id: customerId,
            is_manager: stateData.isManager || false,
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
    await oauthManager.storeTokens(user.id, customerId, tokenData);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=google_connected`,
    );
  } catch (error) {
    Logger.error("Google Ads OAuth callback error:", error as Error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?error=oauth_failed`,
    );
  }
}
