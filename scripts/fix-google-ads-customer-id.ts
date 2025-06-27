import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleAdsOAuthClient } from "../services/google-ads/core/google-ads-oauth-client";
import log from "../utils/logger";

// Load environment variables
config({ path: ".env.local" });

async function fixGoogleAdsCustomerIds() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get all Google Ads credentials that have the old format account_id
  const { data: credentials, error } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("platform", "google")
    .eq("is_active", true)
    .like("account_id", "google_%");

  if (error) {
    console.error("Failed to fetch credentials:", error);
    return;
  }

  console.log(
    `Found ${credentials?.length || 0} Google Ads credentials to fix`,
  );

  for (const credential of credentials || []) {
    try {
      console.log(`\nProcessing credential for team ${credential.team_id}`);
      console.log(`Current account_id: ${credential.account_id}`);

      // Create a Google Ads client
      const client = new GoogleAdsOAuthClient({
        teamId: credential.team_id,
        customerId: undefined,
      });

      // Get accessible customers
      const accessibleCustomers = await client.getAccessibleCustomers();

      if (accessibleCustomers.length > 0) {
        const googleAdsCustomerId = accessibleCustomers[0];
        console.log(`Found Google Ads customer ID: ${googleAdsCustomerId}`);
        console.log(
          `Total accessible customers: ${accessibleCustomers.length}`,
        );

        // Update the credential with the actual customer ID
        const { error: updateError } = await supabase
          .from("platform_credentials")
          .update({
            account_id: googleAdsCustomerId,
            account_name: `Google Ads - ${googleAdsCustomerId}`,
          })
          .eq("id", credential.id);

        if (updateError) {
          console.error(
            `Failed to update credential ${credential.id}:`,
            updateError,
          );
        } else {
          console.log(`✓ Successfully updated credential ${credential.id}`);
        }
      } else {
        console.warn(
          `No accessible customers found for credential ${credential.id}`,
        );
      }
    } catch (error) {
      console.error(`Failed to process credential ${credential.id}:`, error);
    }
  }

  console.log("\nDone!");
}

// Run the script
fixGoogleAdsCustomerIds().catch(console.error);
