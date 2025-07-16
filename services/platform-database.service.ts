import type { SupabaseClient } from "@supabase/supabase-js";

import { Campaign, CampaignMetric, Team } from "@/types";

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export class PlatformDatabaseService {
  private client?: SupabaseClient;

  constructor(
    client?: SupabaseClient,
    private log?: Logger,
  ) {
    if (client) {
      this.client = client;
    }
  }

  private async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      const { createClient } = await import("@/utils/supabase/server");

      this.client = await createClient();
    }

    return this.client;
  }

  async upsertCampaign(
    campaign: Omit<Campaign, "id" | "created_at" | "updated_at">,
  ): Promise<Campaign | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from("campaigns")
      .upsert(
        {
          ...campaign,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "team_id,platform,platform_campaign_id",
        },
      )
      .select()
      .single();

    if (error) {
      this.log?.error("Error upserting campaign:", error);

      return null;
    }

    return data;
  }

  async upsertCampaignMetrics(
    metrics: Omit<CampaignMetric, "id" | "created_at">,
  ): Promise<CampaignMetric | null> {
    const client = await this.getClient();
    const { data, error } = await client
      .from("campaign_metrics")
      .upsert(metrics, {
        onConflict: "campaign_id,date",
      })
      .select()
      .single();

    if (error) {
      this.log?.error("Error upserting campaign metrics:", error);

      return null;
    }

    return data;
  }

  async getCampaignsByTeam(
    teamId: string,
    filters?: {
      platform?: string;
      isActive?: boolean;
    },
  ): Promise<Campaign[]> {
    const client = await this.getClient();
    let query = client.from("campaigns").select("*").eq("team_id", teamId);

    if (filters?.platform) {
      query = query.eq("platform", filters.platform);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    const { data, error } = await query.order("updated_at", {
      ascending: false,
    });

    if (error) {
      this.log?.error("Error fetching campaigns:", error);

      return [];
    }

    return data || [];
  }

  async getCampaignMetrics(
    campaignId: string,
    dateRange?: {
      startDate: string;
      endDate: string;
    },
  ): Promise<CampaignMetric[]> {
    const client = await this.getClient();
    let query = client
      .from("campaign_metrics")
      .select("*")
      .eq("campaign_id", campaignId);

    if (dateRange) {
      query = query
        .gte("date", dateRange.startDate)
        .lte("date", dateRange.endDate);
    }

    const { data, error } = await query.order("date", { ascending: false });

    if (error) {
      this.log?.error("Error fetching campaign metrics:", error);

      return [];
    }

    return data || [];
  }

  async updateCampaignSyncTime(
    teamId: string,
    platform: string,
  ): Promise<void> {
    const client = await this.getClient();
    const { error } = await client
      .from("platform_credentials")
      .update({ synced_at: new Date().toISOString() })
      .eq("team_id", teamId)
      .eq("platform", platform);

    if (error) {
      this.log?.error("Error updating sync time:", error);
    }
  }

  async getUserTeam(userId: string): Promise<Team | null> {
    // First, check if user is a master of any team
    const client = await this.getClient();
    const { data: masterTeam, error: masterError } = await client
      .from("teams")
      .select("*")
      .eq("master_user_id", userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

    if (masterTeam && !masterError) {
      return masterTeam as Team;
    }

    // If not a master, check team_members table
    const { data: memberData, error: memberError } = await client
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .maybeSingle(); // Use maybeSingle instead of single

    if (memberError || !memberData) {
      // No team found, try to create one
      const { data: newTeamId, error: createError } = await client.rpc(
        "create_team_for_user",
        { user_id: userId },
      );

      if (createError || !newTeamId) {
        this.log?.error(`Error creating team for user: ${createError}`);

        return null;
      }

      // Fetch the newly created team
      const { data: newTeam, error: fetchError } = await client
        .from("teams")
        .select("*")
        .eq("id", newTeamId)
        .single();

      if (fetchError) {
        this.log?.error("Error fetching new team:", fetchError);

        return null;
      }

      return newTeam as Team;
    }

    // Fetch the team details
    const { data: team, error: teamError } = await client
      .from("teams")
      .select("*")
      .eq("id", memberData.team_id)
      .single();

    if (teamError) {
      this.log?.error("Error fetching team details:", teamError);

      return null;
    }

    return team as Team;
  }

  async savePlatformCredentials(
    teamId: string,
    platform: string,
    credentials: Record<string, unknown>,
    userId: string,
    additionalData?: Record<string, unknown>,
    accountId?: string,
  ): Promise<boolean> {
    // Check if credentials already exist for this team and platform without a specific account_id
    if (!accountId) {
      // For OAuth platforms, first check if there's an existing credential
      const client = await this.getClient();
      const { data: existing } = await client
        .from("platform_credentials")
        .select("id, account_id")
        .eq("team_id", teamId)
        .eq("platform", platform)
        .single();

      if (existing) {
        // Update existing credential
        const { error } = await client
          .from("platform_credentials")
          .update({
            credentials,
            data: additionalData || {},
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          this.log?.error("Error updating platform credentials:", error);

          return false;
        }

        return true;
      }
    }

    // For new credentials or when account_id is provided
    const effectiveAccountId = accountId || `${platform}_pending_${Date.now()}`;

    const client = await this.getClient();
    const { error } = await client.from("platform_credentials").insert({
      team_id: teamId,
      platform,
      credentials,
      data: additionalData || {},
      account_id: effectiveAccountId,
      is_active: true,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      this.log?.error("Error saving platform credentials:", error);

      return false;
    }

    return true;
  }

  async deletePlatformCredentials(
    teamId: string,
    platform: string,
    accountId?: string,
  ): Promise<boolean> {
    const client = await this.getClient();
    let query = client
      .from("platform_credentials")
      .delete()
      .eq("team_id", teamId)
      .eq("platform", platform);

    // If accountId is provided, use it; otherwise delete all credentials for the platform
    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    const { error } = await query;

    if (error) {
      this.log?.error("Error deleting platform credentials:", error);

      return false;
    }

    return true;
  }

  async getTeamCredentials(teamId: string) {
    const client = await this.getClient();
    const { data, error } = await client
      .from("platform_credentials")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });

    if (error) {
      this.log?.error("Error fetching team credentials:", error);

      return [];
    }

    return data || [];
  }
}
