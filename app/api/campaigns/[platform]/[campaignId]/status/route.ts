import { withAuth } from "@/lib/api/middleware";
import { ApiErrors, handleApiError, validateParams } from "@/lib/api/errors";
import { successResponse } from "@/lib/api/response";
import { createClient } from "@/utils/supabase/server";
import { getPlatformServiceFactory } from "@/lib/di/service-resolver";
import { PlatformType } from "@/types";
import log from "@/utils/logger";

const VALID_PLATFORMS: PlatformType[] = [
  "facebook",
  "google",
  "kakao",
  "naver",
  "coupang",
];

export const PATCH = withAuth(
  async (request, context, routeContext) => {
    try {
      const { platform, campaignId } = await routeContext.params;
      const body = await request.json();

      // Validate request body
      validateParams(body, ["status"]);
      const { status } = body;

      // Validate status value
      if (status !== "ENABLED" && status !== "PAUSED") {
        throw ApiErrors.INVALID_REQUEST(
          "Invalid status value. Must be ENABLED or PAUSED",
        );
      }

      // Validate platform
      const platformType = platform as PlatformType;

      if (!VALID_PLATFORMS.includes(platformType)) {
        throw ApiErrors.INVALID_REQUEST("Invalid platform");
      }

      const is_active = status === "ENABLED";
      const supabase = await createClient();

      // Get platform credentials
      const { data: credential, error: credError } = await supabase
        .from("platform_credentials")
        .select("*")
        .eq("team_id", context.teamMember.team_id)
        .eq("platform", platformType)
        .eq("is_active", true)
        .single();

      if (credError || !credential) {
        throw ApiErrors.NOT_FOUND("Platform credentials");
      }

      // Update status in the platform
      const platformServiceFactory = await getPlatformServiceFactory();
      const platformService =
        platformServiceFactory.createService(platformType);

      await platformService.setCredentials(credential.credentials);

      try {
        const success = await platformService.updateCampaignStatus(
          campaignId,
          is_active,
        );

        if (!success) {
          throw new Error("Failed to update status on platform");
        }

        // Update status in our database
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            is_active,
            status: is_active ? "ACTIVE" : "PAUSED",
            updated_at: new Date().toISOString(),
          })
          .eq("team_id", context.teamMember.team_id)
          .eq("platform", platformType)
          .eq("platform_campaign_id", campaignId);

        if (updateError) {
          throw updateError;
        }

        log.info("Campaign status updated", {
          userId: context.user.id,
          teamId: context.teamMember.team_id,
          platform: platformType,
          campaignId,
          newStatus: status,
        });

        return successResponse(
          { campaignId, is_active, status },
          { message: "Campaign status updated successfully" },
        );
      } catch (error) {
        throw ApiErrors.PLATFORM_ERROR(
          platformType,
          error instanceof Error ? error.message : "Failed to update status",
        );
      }
    } catch (error) {
      return handleApiError(
        error,
        "PATCH /campaigns/[platform]/[campaignId]/status",
      );
    }
  },
  {
    requiredRole: ["master", "team_mate"], // Only master and team_mate can update
  },
);
