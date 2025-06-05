import { NextRequest } from "next/server";

import {
  handleOAuthCallback,
  standardTokenExchange,
} from "@/lib/oauth/oauth-callback-handler";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  return handleOAuthCallback(request, {
    platform: "google",

    getOAuthConfig: async (teamId: string) => {
      const supabase = await createClient();

      const { data: credential } = await supabase
        .from("platform_credentials")
        .select("credentials")
        .eq("team_id", teamId)
        .eq("platform", "google")
        .single();

      if (!credential?.credentials) {
        return null;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      return {
        clientId: credential.credentials.client_id,
        clientSecret: credential.credentials.client_secret,
        redirectUri: `${baseUrl}/api/auth/callback/google-ads`,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scope: ["https://www.googleapis.com/auth/adwords"],
      };
    },

    exchangeCodeForToken: async (code, config) => {
      return standardTokenExchange(
        code,
        config,
        "https://oauth2.googleapis.com/token",
      );
    },
  });
}
