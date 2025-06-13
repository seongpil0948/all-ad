import { createClient } from "@/utils/supabase/server";
import { getPlatformSyncService } from "@/lib/di/service-resolver";
import log from "@/utils/logger";
import { PlatformType } from "@/types";
import { successResponse } from "@/lib/api/response";
import { ApiErrors, handleApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw ApiErrors.UNAUTHORIZED();
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
      throw ApiErrors.TEAM_NOT_FOUND();
    }

    // Parse request body for optional platform parameter
    let body: { platform?: PlatformType } = {};

    try {
      const contentType = request.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        body = await request.json();
      }
    } catch (error) {
      // If JSON parsing fails, continue with empty body
      log.warn("Failed to parse request body", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const platform = body.platform;

    // Validate platform if provided
    if (
      platform &&
      !["google", "facebook", "naver", "kakao", "coupang"].includes(platform)
    ) {
      throw ApiErrors.INVALID_REQUEST("Invalid platform specified");
    }

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
        throw ApiErrors.NOT_FOUND(`Credentials for ${platform}`);
      }

      const success = await syncService.syncPlatform(
        teamMember.team_id,
        platform,
        credential.credentials,
      );

      if (!success) {
        throw ApiErrors.SYNC_FAILED(platform);
      }

      return successResponse(
        {
          platform,
        },
        {
          message: `Successfully synced ${platform}`,
        },
      );
    } else {
      // Sync all platforms
      const result = await syncService.syncAllPlatforms(
        teamMember.team_id,
        user.id,
      );

      return successResponse(
        {
          results: result.results,
        },
        {
          message: result.success
            ? "Successfully synced all platforms"
            : "Some platforms failed to sync",
        },
      );
    }
  } catch (error) {
    return handleApiError(error, "POST /api/sync");
  }
}
