import { create } from "zustand";

import { createClient } from "@/utils/supabase/client";
import { Campaign, CampaignMetric, PlatformType } from "@/types/database.types";

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalClicks: number;
  totalImpressions: number;
  platforms: number;
}

interface CampaignState {
  campaigns: Campaign[];
  metrics: Record<string, CampaignMetric[]>;
  stats: CampaignStats | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    platform?: PlatformType;
    status?: string;
    isActive?: boolean;
  };

  // Actions
  setCampaigns: (campaigns: Campaign[]) => void;
  setStats: (stats: CampaignStats) => void;
  fetchCampaigns: () => Promise<void>;
  fetchCampaignMetrics: (campaignId: string) => Promise<void>;
  updateCampaignBudget: (campaignId: string, budget: number) => Promise<void>;
  toggleCampaignStatus: (campaignId: string) => Promise<void>;
  setFilters: (filters: CampaignState["filters"]) => void;
  clearError: () => void;
}

export const useCampaignStore = create<CampaignState>()((set, get) => ({
  campaigns: [],
  metrics: {},
  stats: null,
  isLoading: false,
  error: null,
  filters: {},

  setCampaigns: (campaigns) => {
    set({ campaigns });
  },

  setStats: (stats) => {
    set({ stats });
  },

  fetchCampaigns: async () => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      // Get user's team
      let teamId = null;

      // Check if user is master of any team
      const { data: masterTeam } = await supabase
        .from("teams")
        .select("id")
        .eq("master_user_id", user.id)
        .maybeSingle();

      if (masterTeam) {
        teamId = masterTeam.id;
      } else {
        // Get user's team membership
        const { data: teamMember } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (teamMember) {
          teamId = teamMember.team_id;
        }
      }

      if (!teamId) throw new Error("No team found");

      // Build query
      let query = supabase
        .from("campaigns")
        .select(
          `
          *,
          platform_credentials (
            platform
          )
        `,
        )
        .eq("team_id", teamId)
        .order("updated_at", { ascending: false });

      // Apply filters
      const { filters } = get();

      if (filters.platform) {
        query = query.eq("platform", filters.platform);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      const { data, error } = await query;

      if (error) throw error;

      const campaigns = data || [];

      // Calculate stats
      const stats: CampaignStats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c) => c.is_active).length,
        totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
        totalClicks: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0),
        totalImpressions: campaigns.reduce(
          (sum, c) => sum + (c.impressions || 0),
          0,
        ),
        platforms: Array.from(
          new Set(campaigns.map((c) => c.platform_credentials?.platform)),
        ).filter(Boolean).length,
      };

      set({
        campaigns,
        stats,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchCampaignMetrics: async (campaignId: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("campaign_metrics")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("date", { ascending: false })
        .limit(30); // Last 30 days

      if (error) throw error;

      set((state) => ({
        metrics: {
          ...state.metrics,
          [campaignId]: data || [],
        },
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateCampaignBudget: async (campaignId: string, budget: number) => {
    const supabase = createClient();

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      // Check permissions
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!teamMember || teamMember.role === "viewer") {
        throw new Error("Insufficient permissions");
      }

      // Update campaign
      const { error } = await supabase
        .from("campaigns")
        .update({
          budget,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId ? { ...c, budget } : c,
        ),
        isLoading: false,
      }));

      // Also update on the platform (call API)
      const campaign = get().campaigns.find((c) => c.id === campaignId);

      if (campaign) {
        await fetch(
          `/api/campaigns/${campaign.platform}/${campaign.platform_campaign_id}/budget`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ budget }),
          },
        );
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  toggleCampaignStatus: async (campaignId: string) => {
    const supabase = createClient();
    const campaign = get().campaigns.find((c) => c.id === campaignId);

    if (!campaign) {
      set({ error: "Campaign not found" });

      return;
    }

    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user logged in");

      // Check permissions
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!teamMember || teamMember.role === "viewer") {
        throw new Error("Insufficient permissions");
      }

      const newStatus = !campaign.is_active;

      // Update in database
      const { error } = await supabase
        .from("campaigns")
        .update({
          is_active: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        campaigns: state.campaigns.map((c) =>
          c.id === campaignId ? { ...c, is_active: newStatus } : c,
        ),
        isLoading: false,
      }));

      // Also update on the platform (call API)
      await fetch(
        `/api/campaigns/${campaign.platform}/${campaign.platform_campaign_id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: newStatus }),
        },
      );
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchCampaigns();
  },

  clearError: () => set({ error: null }),
}));
