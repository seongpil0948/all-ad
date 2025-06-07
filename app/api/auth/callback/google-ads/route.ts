import type { OAuthConfig } from "@/types/oauth";

import { NextRequest } from "next/server";

import {
  handleUnifiedOAuthCallback,
  standardTokenExchange,
} from "@/lib/oauth/unified-oauth-handler";
import { getOAuthConfig } from "@/lib/oauth/platform-configs";

export async function GET(request: NextRequest) {
  return handleUnifiedOAuthCallback(request, {
    platform: "google",
    environment: "production",
    getOAuthConfig: async (_teamId: string): Promise<OAuthConfig | null> => {
      const config = getOAuthConfig("google");

      return config;
    },
    exchangeCodeForToken: async (code: string, config: OAuthConfig) => {
      return standardTokenExchange(
        code,
        config,
        "https://oauth2.googleapis.com/token",
      );
    },
  });
}
