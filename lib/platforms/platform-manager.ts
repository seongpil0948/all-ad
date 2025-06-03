// Platform manager for handling all platform operations

import { PlatformAdapterFactory } from "./adapter-factory";
import { GoogleAdsAdapter } from "./google-ads-adapter";
import { MetaAdsAdapter } from "./meta-ads-adapter";

import {
  PlatformType,
  PlatformConnection,
  Campaign,
  SyncResult,
} from "@/types";
import { createClient } from "@/utils/supabase/server";
import logger from "@/utils/logger";

export class PlatformManager {
  // Connect to a platform
  static async connectPlatform(
    userId: string,
    type: PlatformType,
    credentials: any,
  ): Promise<PlatformConnection> {
    try {
      logger.info("Connecting platform", { userId, type });

      const adapter = PlatformAdapterFactory.getAdapter(type);
      const connection = await adapter.connect(credentials);

      // Store connection in database
      const supabase = createClient();
      const { error } = await supabase.from("platform_connections").insert({
        user_id: userId,
        platform_type: type,
        account_id: connection.accountId,
        account_name: connection.accountName,
        access_token: connection.accessToken, // Should be encrypted
        refresh_token: connection.refreshToken, // Should be encrypted
        expires_at: connection.expiresAt,
        metadata: connection.metadata,
      });

      if (error) {
        logger.error("Failed to store platform connection", error);
        throw new Error("Failed to save platform connection");
      }

      // Initial sync
      await this.syncPlatformData(userId, type, connection.id);

      return connection;
    } catch (error: any) {
      logger.error("Failed to connect platform", error);
      throw error;
    }
  }

  // Disconnect from a platform
  static async disconnectPlatform(
    userId: string,
    type: PlatformType,
    connectionId: string,
  ): Promise<void> {
    try {
      logger.info("Disconnecting platform", { userId, type, connectionId });

      const adapter = PlatformAdapterFactory.getAdapter(type);

      await adapter.disconnect(connectionId);

      // Remove from database
      const supabase = createClient();
      const { error } = await supabase
        .from("platform_connections")
        .delete()
        .eq("user_id", userId)
        .eq("id", connectionId);

      if (error) {
        logger.error("Failed to remove platform connection", error);
        throw new Error("Failed to remove platform connection");
      }

      // Clean up related data
      await this.cleanupPlatformData(userId, type, connectionId);
    } catch (error: any) {
      logger.error("Failed to disconnect platform", error);
      throw error;
    }
  }

  // Sync platform data
  static async syncPlatformData(
    userId: string,
    type: PlatformType,
    connectionId: string,
  ): Promise<SyncResult> {
    try {
      logger.info("Syncing platform data", { userId, type, connectionId });

      const adapter = PlatformAdapterFactory.getAdapter(type);
      const result = await adapter.syncData(connectionId);

      if (result.success) {
        // Update last sync time
        const supabase = createClient();

        await supabase
          .from("platform_connections")
          .update({ last_synced_at: result.syncedAt })
          .eq("id", connectionId);

        // Fetch and store campaigns
        const connection = await this.getConnection(connectionId);

        if (connection) {
          const campaigns = await adapter.getCampaigns(connection.account_id);

          await this.storeCampaigns(userId, campaigns);
        }
      }

      return result;
    } catch (error: any) {
      logger.error("Failed to sync platform data", error);

      return {
        success: false,
        syncedAt: new Date(),
        error: error.message,
      };
    }
  }

  // Get all campaigns across platforms
  static async getAllCampaigns(
    userId: string,
    filters?: {
      platforms?: PlatformType[];
      status?: string[];
      dateRange?: { start: Date; end: Date };
    },
  ): Promise<Campaign[]> {
    try {
      const supabase = createClient();

      let query = supabase.from("campaigns").select("*").eq("user_id", userId);

      if (filters?.platforms?.length) {
        query = query.in("platform_type", filters.platforms);
      }

      if (filters?.status?.length) {
        query = query.in("status", filters.status);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Failed to fetch campaigns", error);
        throw new Error("Failed to fetch campaigns");
      }

      return data || [];
    } catch (error: any) {
      logger.error("Failed to get campaigns", error);
      throw error;
    }
  }

  // Update campaign status
  static async updateCampaignStatus(
    userId: string,
    campaignId: string,
    status: "active" | "paused",
  ): Promise<void> {
    try {
      logger.info("Updating campaign status", { userId, campaignId, status });

      // Get campaign details
      const supabase = createClient();
      const { data: campaign, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("user_id", userId)
        .single();

      if (error || !campaign) {
        throw new Error("Campaign not found");
      }

      // Get platform adapter - for future use when implementing actual platform updates
      // const adapter = PlatformAdapterFactory.getAdapter(campaign.platform_type);

      // Update on platform (this would be implemented in each adapter)
      // For now, just update in database
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({ status, updated_at: new Date() })
        .eq("id", campaignId);

      if (updateError) {
        throw updateError;
      }

      logger.info("Campaign status updated", { campaignId, status });
    } catch (error: any) {
      logger.error("Failed to update campaign status", error);
      throw error;
    }
  }

  // Helper: Get connection details
  private static async getConnection(connectionId: string): Promise<any> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("id", connectionId)
      .single();

    if (error) {
      logger.error("Failed to get connection", error);

      return null;
    }

    return data;
  }

  // Helper: Store campaigns in database
  private static async storeCampaigns(
    userId: string,
    campaigns: Campaign[],
  ): Promise<void> {
    const supabase = createClient();

    // Upsert campaigns
    const campaignsToStore = campaigns.map((campaign) => ({
      id: `${campaign.platformType}_${campaign.id}`,
      user_id: userId,
      platform_type: campaign.platformType,
      platform_campaign_id: campaign.id,
      account_id: campaign.accountId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget,
      budget_type: campaign.budgetType,
      start_date: campaign.startDate,
      end_date: campaign.endDate,
      objective: campaign.objective,
      metrics: campaign.metrics,
      updated_at: new Date(),
    }));

    const { error } = await supabase
      .from("campaigns")
      .upsert(campaignsToStore, {
        onConflict: "id",
      });

    if (error) {
      logger.error("Failed to store campaigns", error);
    }
  }

  // Helper: Clean up platform data
  private static async cleanupPlatformData(
    userId: string,
    type: PlatformType,
    _connectionId: string,
  ): Promise<void> {
    const supabase = createClient();

    // Delete campaigns
    await supabase
      .from("campaigns")
      .delete()
      .eq("user_id", userId)
      .eq("platform_type", type);

    // Delete other related data
    // ... (ad groups, ads, etc.)
  }

  // Get OAuth URL for platform
  static getOAuthUrl(type: PlatformType, state: string): string {
    switch (type) {
      case PlatformType.GOOGLE:
        return (new GoogleAdsAdapter() as any).getAuthUrl(state);
      case PlatformType.META:
        return (new MetaAdsAdapter() as any).getAuthUrl(state);
      default:
        throw new Error(`OAuth not supported for platform: ${type}`);
    }
  }
}
