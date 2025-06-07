import { NextRequest } from "next/server";

import {
  handleUnifiedOAuthCallback,
  standardTokenExchange,
} from "@/lib/oauth/unified-oauth-handler";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  return handleUnifiedOAuthCallback(request, {
    platform: "facebook",
    environment: "production",

    getOAuthConfig: async (teamId: string) => {
      const supabase = await createClient();

      const { data: credential } = await supabase
        .from("platform_credentials")
        .select("credentials")
        .eq("team_id", teamId)
        .eq("platform", "facebook")
        .single();

      if (!credential?.credentials) {
        return null;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      return {
        clientId: credential.credentials.app_id,
        clientSecret: credential.credentials.app_secret,
        redirectUri: `${baseUrl}/api/auth/callback/facebook-ads`,
        authorizationUrl: "https://www.facebook.com/v23.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
        scope: ["ads_management", "ads_read"],
      };
    },

    exchangeCodeForToken: async (code, config) => {
      return standardTokenExchange(
        code,
        config,
        "https://graph.facebook.com/v23.0/oauth/access_token",
      );
    },
  });
}
