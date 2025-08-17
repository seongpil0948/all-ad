import { Campaign } from "@/types/campaign.types";
import { Database } from "@/types/supabase.types";

type DbCampaign = Database["public"]["Tables"]["campaigns"]["Row"];

/**
 * Transforms a database campaign record to the application Campaign interface
 */
export function transformDbCampaignToApp(dbCampaign: DbCampaign): Campaign {
  return {
    id: dbCampaign.id,
    team_id: dbCampaign.team_id,
    platform: dbCampaign.platform,
    platform_campaign_id: dbCampaign.platform_campaign_id,
    platform_credential_id: dbCampaign.platform_credential_id,
    name: dbCampaign.name,
    status: dbCampaign.status,
    is_active: dbCampaign.is_active,
    budget: dbCampaign.budget,
    raw_data: dbCampaign.raw_data,
    created_at: dbCampaign.created_at,
    updated_at: dbCampaign.updated_at,
    synced_at: dbCampaign.synced_at,
  };
}

/**
 * Transforms an application Campaign to a database record for insert/update
 */
export function transformAppCampaignToDb(
  campaign: Partial<Campaign>,
): Partial<DbCampaign> {
  return {
    id: campaign.id,
    team_id: campaign.team_id,
    platform: campaign.platform,
    platform_campaign_id: campaign.platform_campaign_id,
    platform_credential_id: campaign.platform_credential_id,
    name: campaign.name,
    status: campaign.status,
    is_active: campaign.is_active,
    budget: campaign.budget,
    raw_data: campaign.raw_data,
    updated_at: new Date().toISOString(),
    synced_at: campaign.synced_at,
  };
}
