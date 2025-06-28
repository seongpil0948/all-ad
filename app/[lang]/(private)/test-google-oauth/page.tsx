import { GoogleAdsSimpleConnect } from "@/components/integrations/google-ads/GoogleAdsSimpleConnect";
import { createClient } from "@/utils/supabase/server";

export default async function TestGoogleOAuthPage() {
  const supabase = await createClient();

  // Get current user's team
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user?.id || "")
    .single();

  // Check if Google Ads is connected
  const { data: credential } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("team_id", teamMember?.team_id || "")
    .eq("platform", "google")
    .eq("is_active", true)
    .single();

  const isConnected = !!credential;
  const accountEmail = credential?.data?.user_email as string | undefined;

  const handleDisconnect = async () => {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user?.id || "")
      .single();

    if (teamMember) {
      await supabase
        .from("platform_credentials")
        .update({ is_active: false })
        .eq("team_id", teamMember.team_id)
        .eq("platform", "google");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Google OAuth Test</h1>

      <div className="max-w-2xl mx-auto">
        <GoogleAdsSimpleConnect
          accountEmail={accountEmail}
          isConnected={isConnected}
          onDisconnect={handleDisconnect}
        />

        {isConnected && (
          <div className="mt-8 p-4 bg-default-100 rounded-lg">
            <h2 className="font-semibold mb-2">Connection Details:</h2>
            <pre className="text-xs">
              {JSON.stringify(credential?.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
