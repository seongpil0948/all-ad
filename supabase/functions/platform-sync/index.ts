import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { platform, team_id, credential_id, sync_type, date_range } =
      await req.json();

    if (!platform || !team_id || !credential_id) {
      throw new Error("Missing required parameters");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get credential details
    const { data: credential, error: credError } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("id", credential_id)
      .single();

    if (credError || !credential) {
      throw new Error("Credential not found");
    }

    // Here you would implement the actual sync logic for each platform
    // For now, we'll simulate a sync operation
    const syncResults = {
      campaigns_count: 0,
      metrics_count: 0,
      errors: [],
    };

    // Simulate sync based on platform
    switch (platform) {
      case "google":
        // In a real implementation, you would:
        // 1. Use the Google Ads API with the stored credentials
        // 2. Fetch campaigns and metrics
        // 3. Store them in the database

        // For now, just update the last sync time
        await supabase
          .from("platform_credentials")
          .update({
            last_synced_at: new Date().toISOString(),
            data: {
              ...credential.data,
              last_sync_type: sync_type,
              last_sync_date_range: date_range,
            },
          })
          .eq("id", credential_id);

        syncResults.campaigns_count = Math.floor(Math.random() * 10) + 1;
        syncResults.metrics_count = syncResults.campaigns_count * 7;
        break;

      case "facebook":
      case "kakao":
      case "naver":
        // Similar implementation for other platforms
        syncResults.campaigns_count = Math.floor(Math.random() * 5) + 1;
        syncResults.metrics_count = syncResults.campaigns_count * 7;
        break;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...syncResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
