import { GoogleAdsApi, Customer } from "google-ads-api";

import { createClient } from "@/utils/supabase/server";
import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";
import log from "@/utils/logger";

interface GoogleAdsOAuthCredentials {
  teamId: string;
  customerId?: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

// Google Ads API client with simplified OAuth
export class GoogleAdsOAuthClient {
  private client: GoogleAdsApi | null = null;
  private customer: Customer | null = null;
  private tokenData: TokenData | null = null;

  constructor(private credentials: GoogleAdsOAuthCredentials) {}

  // Initialize client with All-AD's OAuth credentials
  private async initializeClient() {
    if (this.client) return;

    const config = await getAllAdOAuthConfig("google");

    if (!config) {
      throw new Error("Google OAuth configuration not found");
    }

    this.client = new GoogleAdsApi({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      developer_token:
        (config as { developerToken?: string }).developerToken || "",
    });
  }

  // Get or refresh access token
  private async getValidToken(): Promise<TokenData> {
    const supabase = await createClient();

    // Get stored tokens from platform_credentials
    const { data: credential, error } = await supabase
      .from("platform_credentials")
      .select("data")
      .eq("team_id", this.credentials.teamId)
      .eq("platform", "google")
      .eq("is_active", true)
      .single();

    if (error || !credential) {
      throw new Error("No active Google Ads credentials found");
    }

    const tokenData = credential.data as TokenData;

    // Check if token is expired or will expire soon (5 minutes buffer)
    const now = Date.now();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes

    if (tokenData.expiry_date && tokenData.expiry_date - now < expiryBuffer) {
      // Token expired or expiring soon, refresh it
      const refreshedToken = await this.refreshAccessToken(
        tokenData.refresh_token,
      );

      // Update stored tokens
      const { error: updateError } = await supabase
        .from("platform_credentials")
        .update({
          data: {
            ...credential.data,
            access_token: refreshedToken.access_token,
            expiry_date: refreshedToken.expiry_date,
            updated_at: new Date().toISOString(),
          },
        })
        .eq("team_id", this.credentials.teamId)
        .eq("platform", "google");

      if (updateError) {
        log.error("Failed to update refreshed token", updateError);
      }

      return refreshedToken;
    }

    return tokenData;
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    const config = await getAllAdOAuthConfig("google");

    if (!config) {
      throw new Error("Google OAuth configuration not found");
    }

    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    });

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();

      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: refreshToken, // Refresh token doesn't change
      expiry_date: Date.now() + data.expires_in * 1000,
      token_type: data.token_type,
      scope: data.scope,
    };
  }

  // Get authenticated customer client
  async getAuthenticatedCustomer(customerId?: string): Promise<Customer> {
    await this.initializeClient();

    if (!this.client) {
      throw new Error("Google Ads API client not initialized");
    }

    const token = await this.getValidToken();
    const targetCustomerId = customerId || this.credentials.customerId;

    if (!targetCustomerId) {
      throw new Error("Customer ID is required");
    }

    // Create customer with fresh token
    this.customer = this.client.Customer({
      customer_id: targetCustomerId,
      refresh_token: token.refresh_token,
      login_customer_id: this.credentials.customerId, // For MCC accounts
    });

    return this.customer;
  }

  // Execute Google Ads Query Language (GAQL) query
  async query<T = unknown>(query: string, customerId?: string): Promise<T[]> {
    try {
      const customer = await this.getAuthenticatedCustomer(customerId);
      const results = await customer.query(query);

      log.info("Google Ads query executed successfully", {
        customerId: customerId || this.credentials.customerId,
        resultCount: results.length,
      });

      return results as T[];
    } catch (error) {
      log.error("Google Ads query failed", error as Error, {
        customerId: customerId || this.credentials.customerId,
        query,
      });
      throw error;
    }
  }

  // Execute mutations
  async mutate(
    operations: any[],
    customerId?: string,
    options?: { validate_only?: boolean; partial_failure?: boolean },
  ) {
    try {
      const customer = await this.getAuthenticatedCustomer(customerId);
      const response = await customer.mutateResources(operations, options);

      log.info("Google Ads mutation successful", {
        customerId: customerId || this.credentials.customerId,
        operationCount: operations.length,
      });

      return response;
    } catch (error) {
      log.error("Google Ads mutation failed", error as Error, {
        customerId: customerId || this.credentials.customerId,
        operationCount: operations.length,
      });
      throw error;
    }
  }

  // Get accessible customers (for MCC accounts)
  async getAccessibleCustomers(): Promise<string[]> {
    try {
      const customer = await this.getAuthenticatedCustomer();

      const query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.manager
        FROM customer_client
        WHERE customer_client.level <= 1
      `;

      const results = await customer.query(query);
      const customerIds = results
        .map((result: any) => result.customer_client?.id)
        .filter(Boolean);

      log.info("Retrieved accessible customers", {
        count: customerIds.length,
      });

      return customerIds;
    } catch (error) {
      log.error("Failed to get accessible customers", error as Error);
      throw error;
    }
  }
}
