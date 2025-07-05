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
      validateParams<{ budget: number }>(body, ["budget"]);
      const { budget } = body;

      // Validate budget value
      if (isNaN(budget) || budget < 0) {
        throw ApiErrors.INVALID_REQUEST(
          "Invalid budget value. Must be a positive number",
        );
      }

      // Validate platform
      const platformType = platform as PlatformType;

      if (!VALID_PLATFORMS.includes(platformType)) {
        throw ApiErrors.INVALID_REQUEST("Invalid platform");
      }

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

      // Update budget in the platform
      const platformServiceFactory = await getPlatformServiceFactory();
      const platformService =
        platformServiceFactory.createService(platformType);

      // Use MCC/System User/Business Center for multi-account access
      if (
        credential.credentials.is_mcc ||
        credential.credentials.is_system_user ||
        credential.credentials.is_business_center
      ) {
        if (platformService.setMultiAccountCredentials) {
          platformService.setMultiAccountCredentials(credential.credentials);
        } else {
          // Fallback to regular credentials if multi-account method not available
          platformService.setCredentials(credential.credentials);
        }
      } else {
        platformService.setCredentials(credential.credentials);
      }

      try {
        // For Google campaigns, strip the "google_" prefix if present
        let actualCampaignId = campaignId;

        if (platformType === "google" && campaignId.startsWith("google_")) {
          actualCampaignId = campaignId.replace("google_", "");
        }

        const success = await platformService.updateCampaignBudget(
          actualCampaignId,
          budget,
        );

        if (!success) {
          throw new Error("Failed to update budget on platform");
        }

        // Update budget in our database
        const { error: updateError } = await supabase
          .from("campaigns")
          .update({
            budget,
            updated_at: new Date().toISOString(),
          })
          .eq("team_id", context.teamMember.team_id)
          .eq("platform", platformType)
          .eq("platform_campaign_id", campaignId);

        if (updateError) {
          throw updateError;
        }

        log.info("Campaign budget updated", {
          userId: context.user.id,
          teamId: context.teamMember.team_id,
          platform: platformType,
          campaignId,
          newBudget: budget,
        });

        return successResponse(
          { campaignId, budget },
          { message: "Budget updated successfully" },
        );
      } catch (error) {
        throw ApiErrors.PLATFORM_ERROR(
          platformType,
          error instanceof Error ? error.message : "Failed to update budget",
        );
      }
    } catch (error) {
      return handleApiError(
        error,
        "PATCH /campaigns/[platform]/[campaignId]/budget",
      );
    }
  },
  {
    requiredRole: ["master", "team_mate"], // Only master and team_mate can update
  },
);
