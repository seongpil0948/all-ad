import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

async function updateGoogleAdsCustomerId() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 임시로 테스트 customer ID로 업데이트
  // 실제로는 사용자가 OAuth를 다시 연결해야 합니다
  const testCustomerId = "7702718698"; // 예시 Customer ID

  const { data: credentials, error: fetchError } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("platform", "google")
    .eq("is_active", true)
    .like("account_id", "google_%");

  if (fetchError) {
    console.error("Failed to fetch credentials:", fetchError);
    return;
  }

  console.log(
    `Found ${credentials?.length || 0} Google Ads credentials to update`,
  );

  if (credentials && credentials.length > 0) {
    // 첫 번째 자격 증명만 업데이트 (테스트용)
    const credential = credentials[0];

    const { error: updateError } = await supabase
      .from("platform_credentials")
      .update({
        account_id: testCustomerId,
        account_name: `Google Ads - ${testCustomerId}`,
      })
      .eq("id", credential.id);

    if (updateError) {
      console.error("Failed to update credential:", updateError);
    } else {
      console.log(
        `✓ Updated credential ${credential.id} with customer ID: ${testCustomerId}`,
      );
      console.log("\n⚠️  Note: This is a temporary fix for testing.");
      console.log(
        "In production, users need to reconnect their Google Ads account to get the correct customer ID.",
      );
    }
  }
}

// Run the script
updateGoogleAdsCustomerId().catch(console.error);
