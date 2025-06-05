import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { getPlatformSyncService } from "@/lib/di/service-resolver";
import log from "@/utils/logger";
import { PlatformType } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team
    const { data: teamMember, error: teamError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .single();

    if (teamError || !teamMember) {
      log.error("Team not found for user", {
        userId: user.id,
        error: teamError,
      });

      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Parse request body for optional platform parameter
    const body = await request.json().catch(() => ({}));
    const platform = body.platform as PlatformType | undefined;

    const syncService = await getPlatformSyncService();

    if (platform) {
      // Sync specific platform
      const { data: credential, error: credError } = await supabase
        .from("platform_credentials")
        .select("credentials")
        .eq("team_id", teamMember.team_id)
        .eq("platform", platform)
        .eq("is_active", true)
        .single();

      if (credError || !credential) {
        log.error("No credentials found for platform", {
          platform,
          error: credError,
        });

        return NextResponse.json(
          { error: `No credentials found for ${platform}` },
          { status: 404 },
        );
      }

      const success = await syncService.syncPlatform(
        teamMember.team_id,
        platform,
        credential.credentials,
      );

      return NextResponse.json({
        success,
        platform,
        message: success
          ? `Successfully synced ${platform}`
          : `Failed to sync ${platform}`,
      });
    } else {
      // Sync all platforms
      const result = await syncService.syncAllPlatforms(
        teamMember.team_id,
        user.id,
      );

      return NextResponse.json({
        success: result.success,
        results: result.results,
        message: result.success
          ? "Successfully synced all platforms"
          : "Some platforms failed to sync",
      });
    }
  } catch (error) {
    log.error("Unexpected error in POST /api/sync", { error });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
