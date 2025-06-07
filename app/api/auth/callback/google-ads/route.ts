import { NextRequest } from "next/server";

import {
  handleOAuthCallback,
  standardTokenExchange,
} from "@/lib/oauth/oauth-callback-handler";
import { getOAuthConfig } from "@/lib/oauth/platform-configs";
import type { OAuthConfig } from "@/types/oauth";

export async function GET(request: NextRequest) {
  return handleOAuthCallback(request, {
    platform: "google",
    getOAuthConfig: async (teamId: string): Promise<OAuthConfig | null> => {
      const config = getOAuthConfig("google");
      return config;
    },
    exchangeCodeForToken: async (code: string, config: OAuthConfig) => {
      return standardTokenExchange(
        code,
        config,
        "https://oauth2.googleapis.com/token"
      );
    },
  });
}
