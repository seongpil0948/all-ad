import "server-only";

import { refreshAccessToken } from "./oauth-handlers";
import {
  getCredentialsNeedingRefresh,
  updatePlatformTokens,
  markCredentialFailed,
  TokenRefreshResult,
} from "./platform-auth";

import { PlatformType } from "@/types";
import log from "@/utils/logger";

// Token refresh service that runs periodically
export class TokenRefreshService {
  private static instance: TokenRefreshService;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }

    return TokenRefreshService.instance;
  }

  // Start the token refresh service (disabled for now)
  start(): void {
    // Disabled automatic token refresh to avoid request context issues
    // Token refresh should be triggered manually via API endpoints
    log.info("Token refresh service is disabled - use manual refresh via API");
    this.isRunning = false;
  }

  // Stop the token refresh service
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isRunning = false;

    log.info("Token refresh service stopped");
  }

  // Manually trigger token refresh (requires teamId)
  async refreshExpiredTokens(teamId?: string): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ credentialId: string; error: string }>;
  }> {
    if (!teamId) {
      log.warn("Token refresh called without teamId - skipping");

      return { successful: 0, failed: 0, errors: [] };
    }

    log.info("Starting token refresh cycle", { teamId });

    try {
      const credentialsNeedingRefresh =
        await getCredentialsNeedingRefresh(teamId);

      if (credentialsNeedingRefresh.length === 0) {
        log.info("No credentials need token refresh");

        return { successful: 0, failed: 0, errors: [] };
      }

      log.info(
        `Found ${credentialsNeedingRefresh.length} credentials needing refresh`,
      );

      const results = await Promise.allSettled(
        credentialsNeedingRefresh.map((credential) =>
          this.refreshSingleCredential(credential),
        ),
      );

      let successful = 0;
      let failed = 0;
      const errors: Array<{ credentialId: string; error: string }> = [];

      results.forEach((result, index) => {
        const credential = credentialsNeedingRefresh[index];

        if (result.status === "fulfilled" && result.value.success) {
          successful++;
          log.info("Token refresh successful", {
            credentialId: credential.id,
            platform: credential.platform,
          });
        } else {
          failed++;
          const error =
            result.status === "rejected"
              ? result.reason?.message || "Unknown error"
              : result.value.error || "Token refresh failed";

          errors.push({
            credentialId: credential.id,
            error,
          });

          log.error("Token refresh failed", {
            credentialId: credential.id,
            platform: credential.platform,
            error,
          });
        }
      });

      log.info("Token refresh cycle completed", {
        total: credentialsNeedingRefresh.length,
        successful,
        failed,
      });

      return { successful, failed, errors };
    } catch (error) {
      log.error("Error during token refresh cycle", error);
      throw error;
    }
  }

  // Refresh a single credential
  async refreshSingleCredential(credential: {
    id: string;
    platform: PlatformType;
    refresh_token?: string;
    access_token: string;
    account_name?: string;
    team_id?: string;
    credentials?: Record<string, unknown>;
  }): Promise<TokenRefreshResult> {
    try {
      if (!credential.refresh_token) {
        const error = "No refresh token available";

        await markCredentialFailed(credential.id, error);

        return { success: false, error };
      }

      // Get client credentials
      let clientId: string | undefined;
      let clientSecret: string | undefined;

      // For Google, check if we're using simplified OAuth (env vars)
      if (
        credential.platform === "google" &&
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET
      ) {
        clientId = process.env.GOOGLE_CLIENT_ID;
        clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        log.info("Using simplified OAuth credentials for Google");
      } else {
        // Get client credentials from stored data
        const storedCreds = credential.credentials as {
          client_id?: string;
          client_secret?: string;
        };

        clientId = storedCreds?.client_id;
        clientSecret = storedCreds?.client_secret;
      }

      if (!clientId || !clientSecret) {
        const error = "Client credentials not found";

        await markCredentialFailed(credential.id, error);

        return { success: false, error };
      }

      // Use the OAuth handler to refresh the token
      const refreshedTokens = await refreshAccessToken(
        credential.platform,
        credential.refresh_token,
        clientId,
        clientSecret,
      );

      // Calculate expiry time
      const expiresAt = refreshedTokens.expires_in
        ? new Date(Date.now() + refreshedTokens.expires_in * 1000).toISOString()
        : undefined;

      // Update the credential in database
      await updatePlatformTokens(credential.id, {
        access_token: refreshedTokens.access_token,
        refresh_token:
          refreshedTokens.refresh_token || credential.refresh_token,
        expires_at: expiresAt,
      });

      return {
        success: true,
        access_token: refreshedTokens.access_token,
        refresh_token: refreshedTokens.refresh_token,
        expires_at: expiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Token refresh failed";

      await markCredentialFailed(credential.id, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Refresh specific platform credentials for a team
  async refreshPlatformCredentials(
    teamId: string,
    platform?: string,
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ credentialId: string; error: string }>;
  }> {
    try {
      // Get credentials for the team that need refresh
      const allCredentials = await getCredentialsNeedingRefresh(teamId);

      // Filter by platform if specified
      const credentialsToRefresh = platform
        ? allCredentials.filter((cred) => cred.platform === platform)
        : allCredentials;

      if (credentialsToRefresh.length === 0) {
        return { successful: 0, failed: 0, errors: [] };
      }

      const results = await Promise.allSettled(
        credentialsToRefresh.map((credential) =>
          this.refreshSingleCredential(credential),
        ),
      );

      let successful = 0;
      let failed = 0;
      const errors: Array<{ credentialId: string; error: string }> = [];

      results.forEach((result, index) => {
        const credential = credentialsToRefresh[index];

        if (result.status === "fulfilled" && result.value.success) {
          successful++;
        } else {
          failed++;
          const error =
            result.status === "rejected"
              ? result.reason?.message || "Unknown error"
              : result.value.error || "Token refresh failed";

          errors.push({
            credentialId: credential.id,
            error,
          });
        }
      });

      log.info("Platform credentials refresh completed", {
        teamId,
        platform,
        total: credentialsToRefresh.length,
        successful,
        failed,
      });

      return { successful, failed, errors };
    } catch (error) {
      log.error("Error refreshing platform credentials", {
        teamId,
        platform,
        error,
      });
      throw error;
    }
  }

  // Get service status
  getStatus(): {
    isRunning: boolean;
    hasInterval: boolean;
  } {
    return {
      isRunning: this.isRunning,
      hasInterval: this.refreshInterval !== null,
    };
  }
}

// Export singleton instance
export const tokenRefreshService = TokenRefreshService.getInstance();

// Helper function to initialize the service
export function initializeTokenRefreshService(): void {
  const intervalMinutes = process.env.NODE_ENV === "production" ? 30 : 5; // 5 minutes in dev, 30 in prod

  tokenRefreshService.start();

  log.info(
    `Token refresh service initialized (interval: ${intervalMinutes} minutes)`,
  );
}

// Graceful shutdown
export function shutdownTokenRefreshService(): void {
  tokenRefreshService.stop();
  log.info("Token refresh service shutdown completed");
}
