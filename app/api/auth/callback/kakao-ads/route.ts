import { NextRequest } from "next/server";

import { handleUnifiedOAuthCallback } from "@/lib/oauth/unified-oauth-handler";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  return handleUnifiedOAuthCallback(request, {
    platform: "kakao",
    environment: "production",

    getOAuthConfig: async (teamId: string) => {
      const supabase = await createClient();

      const { data: credential } = await supabase
        .from("platform_credentials")
        .select("credentials")
        .eq("team_id", teamId)
        .eq("platform", "kakao")
        .single();

      if (!credential?.credentials) {
        return null;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      return {
        clientId: credential.credentials.rest_api_key,
        clientSecret: credential.credentials.client_secret || "",
        redirectUri: `${baseUrl}/api/auth/callback/kakao-ads`,
        authorizationUrl: "https://kauth.kakao.com/oauth/authorize",
        tokenUrl: "https://kauth.kakao.com/oauth/token",
        scope: [],
      };
    },

    exchangeCodeForToken: async (_code, _config) => {
      // Legacy OAuth token exchange removed
      // TODO: Implement token exchange
      throw new Error("Token exchange not implemented");

      /*
      const tokenData = await standardTokenExchange(
        code,
        config,
        "https://kauth.kakao.com/oauth/token",
      );

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
      const primaryAccount = adAccounts[0];

      if (!primaryAccount) {
        throw new Error("No Kakao ad account found");
      }

      // Update platform credentials with account info
      const stateData = JSON.parse(
        Buffer.from(
          request.nextUrl.searchParams.get("state")!,
          "base64",
        ).toString(),
      );

      const supabase = await createClient();
      const { data: pendingCreds } = await supabase
        .from("platform_credentials")
        .select("id, data")
        .eq("team_id", stateData.teamId)
        .eq("platform", "kakao")
        .ilike("account_id", "kakao_pending_%")
        .single();

      if (pendingCreds) {
        await supabase
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
      }

      return tokenData;
      */
    },
  });
}
