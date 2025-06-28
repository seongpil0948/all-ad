// Transform database campaign to application campaign
import { Campaign as DBCampaign } from "@/types";
import { Campaign as AppCampaign } from "@/types/campaign.types";

export function transformDbCampaignToApp(dbCampaign: DBCampaign): AppCampaign {
  return {
    id: dbCampaign.id,
    teamId: dbCampaign.team_id,
    platform: dbCampaign.platform,
    platformCampaignId: dbCampaign.platform_campaign_id,
    name: dbCampaign.name,
    status: (dbCampaign.status?.toLowerCase() ||
      "active") as AppCampaign["status"],
    budget: dbCampaign.budget || undefined,
    isActive: dbCampaign.is_active ?? false,
    createdAt: dbCampaign.created_at,
    updatedAt: dbCampaign.updated_at,
  };
}

export function transformAppCampaignToDb(
  appCampaign: Partial<AppCampaign>,
): Partial<DBCampaign> {
  return {
    id: appCampaign.id,
    team_id: appCampaign.teamId,
    platform: appCampaign.platform,
    platform_campaign_id: appCampaign.platformCampaignId,
    name: appCampaign.name,
    status: appCampaign.status,
    budget: appCampaign.budget,
    is_active: appCampaign.isActive,
    created_at: appCampaign.createdAt,
    updated_at: appCampaign.updatedAt,
  };
}
