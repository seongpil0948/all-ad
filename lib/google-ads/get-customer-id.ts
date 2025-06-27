import { GoogleAdsApi } from "google-ads-api";

import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";
import log from "@/utils/logger";

/**
 * Get accessible Google Ads customer IDs using access token
 * This is used in OAuth callback to get the customer ID without database dependency
 */
export async function getGoogleAdsCustomerId(
  accessToken: string,
  refreshToken: string,
): Promise<string | null> {
  try {
    const config = await getAllAdOAuthConfig("google");

    if (!config) {
      throw new Error("Google OAuth configuration not found");
    }

    // Create Google Ads API client
    const client = new GoogleAdsApi({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      developer_token:
        (config as { developerToken?: string }).developerToken || "",
    });

    // List accessible customers
    const response = await client.listAccessibleCustomers(refreshToken);

    // The response contains resource_names array
    const customerResourceNames = response.resource_names || [];

    if (customerResourceNames.length === 0) {
      log.warn("No accessible Google Ads customers found");

      return null;
    }

    // Get the first accessible customer (resource name format)
    const firstCustomerResourceName = customerResourceNames[0];

    // Extract customer ID from resource name (e.g., "customers/1234567890" -> "1234567890")
    const customerId = firstCustomerResourceName.replace("customers/", "");

    log.info("Found Google Ads customer ID", {
      customerId,
      totalCustomers: customerResourceNames.length,
    });

    return customerId;
  } catch (error) {
    log.error("Failed to get Google Ads customer ID", error as Error);

    return null;
  }
}
