import { OAuthConfig } from "./oauth-client";

import log from "@/utils/logger";
import { setToken, getToken } from "@/lib/redis";
import { createClient } from "@/utils/supabase/server";

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token_expires_in?: number;
}

export class OAuthManager {
  private config: OAuthConfig;
  private platform: string;

  constructor(platform: string, config: OAuthConfig) {
    this.platform = platform;
    this.config = config;
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scope.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    });

    return `${this.config.authorizationUrl}?${params}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<TokenData> {
    const params = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: "authorization_code",
    });

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();

        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokenData: TokenData = await response.json();

      return tokenData;
    } catch (error) {
      log.error(
        `OAuth token exchange failed for ${this.platform}:`,
        error as Error,
      );
      throw error;
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "refresh_token",
    });

    try {
      const response = await fetch(this.config.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        const error = await response.text();

        throw new Error(`Token refresh failed: ${error}`);
      }

      const tokenData: TokenData = await response.json();

      return tokenData;
    } catch (error) {
      log.error(
        `OAuth token refresh failed for ${this.platform}:`,
        error as Error,
      );
      throw error;
    }
  }

  // Store tokens in Redis with automatic expiry
  async storeTokens(
    userId: string,
    accountId: string,
    tokenData: TokenData,
  ): Promise<void> {
    const tokenKey = `oauth:${this.platform}:${userId}:${accountId}:tokens`;

    // Store the complete token data
    await setToken(tokenKey, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      refresh_expires_at: tokenData.refresh_token_expires_in
        ? Date.now() + tokenData.refresh_token_expires_in * 1000
        : null,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });

    // Also update the database with non-sensitive connection info
    const supabase = await createClient();

    await supabase
      .from("platform_credentials")
      .update({
        is_active: true,
        last_synced_at: new Date().toISOString(),
        // Store only necessary non-sensitive data
        data: {
          connected: true,
          connected_at: new Date().toISOString(),
          scope: tokenData.scope,
        },
      })
      .eq("user_id", userId)
      .eq("platform", this.platform)
      .eq("account_id", accountId);
  }

  // Get valid access token (refresh if needed)
  async getValidAccessToken(
    userId: string,
    accountId: string,
  ): Promise<string | null> {
    const tokenKey = `oauth:${this.platform}:${userId}:${accountId}:tokens`;
    const tokenData = await getToken(tokenKey);

    if (!tokenData) {
      log.error(`No tokens found for ${this.platform}:${userId}:${accountId}`);

      return null;
    }

    // Check if access token is still valid
    const now = Date.now();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

    if (tokenData.expires_at && tokenData.expires_at - now > expiryBuffer) {
      return tokenData.access_token;
    }

    // Token expired or about to expire, try to refresh
    if (!tokenData.refresh_token) {
      log.error(
        `No refresh token available for ${this.platform}:${userId}:${accountId}`,
      );

      return null;
    }

    try {
      const newTokenData = await this.refreshAccessToken(
        tokenData.refresh_token,
      );

      // Update stored tokens
      await this.storeTokens(userId, accountId, {
        ...newTokenData,
        refresh_token: newTokenData.refresh_token || tokenData.refresh_token,
      });

      return newTokenData.access_token;
    } catch (error) {
      log.error(
        `Failed to refresh token for ${this.platform}:${userId}:${accountId}:`,
        error as Error,
      );

      return null;
    }
  }
}
