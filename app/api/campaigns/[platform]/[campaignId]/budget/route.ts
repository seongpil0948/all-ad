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

      // Extract customer ID for Google Ads
      let customerId = credential.customer_id;

      // Fallback: If customer_id is not set, try to extract from account_id for Google
      if (!customerId && platformType === "google") {
        // For Google Ads, the account_id might be the customer ID
        customerId = credential.account_id;

        // If account_id looks like a temporary ID, try to get from data
        if (customerId && customerId.startsWith("google_")) {
          // Try to extract customer ID from the data field
          const dataCustomerId = credential.data?.customer_id;

          if (dataCustomerId) {
            customerId = dataCustomerId;
          }
        }
      }

      const credentialsWithTeamId = {
        ...credential.credentials,
        teamId: context.teamMember.team_id,
        customerId: customerId,
      };

      // Use MCC/System User/Business Center for multi-account access
      if (
        credential.credentials.is_mcc ||
        credential.credentials.is_system_user ||
        credential.credentials.is_business_center
      ) {
        if (platformService.setMultiAccountCredentials) {
          await platformService.setMultiAccountCredentials(
            credentialsWithTeamId,
          );
        } else {
          // Fallback to regular credentials if multi-account method not available
          platformService.setCredentials(credentialsWithTeamId);
        }
      } else {
        platformService.setCredentials(credentialsWithTeamId);
      }

      try {
        // Get the actual platform campaign ID from the database
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("platform_campaign_id")
          .eq("team_id", context.teamMember.team_id)
          .eq("platform", platformType)
          .eq("id", campaignId)
          .single();

        if (campaignError || !campaignData) {
          throw ApiErrors.NOT_FOUND("Campaign not found");
        }

        const actualCampaignId = campaignData.platform_campaign_id;

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
          .eq("id", campaignId);

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
