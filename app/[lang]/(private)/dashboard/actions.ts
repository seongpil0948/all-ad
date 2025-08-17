"use server";

import { cache } from "react";
import { revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Campaign } from "@/types/campaign.types";

const getCampaigns = cache(
  async ({
    page = 1,
    limit = 10,
    filters = {},
  }: {
    page?: number;
    limit?: number;
    filters?: Record<string, unknown>;
  }): Promise<{ campaigns: Campaign[]; hasMore: boolean }> => {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("campaigns")
      .select("*, metrics:campaign_metrics(*)")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filters.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }
    if (filters.platform) {
      query = query.eq("platform", filters.platform);
    }
    if (filters.isActive !== undefined) {
      query = query.eq("is_active", filters.isActive);
    }

    const { data: campaigns, error } = await query;

    if (error) {
      console.error("Error fetching campaigns:", error);
      throw new Error("Failed to fetch campaigns.");
    }

    const { count } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true });

    const hasMore = (count ?? 0) > page * limit;

    return { campaigns: campaigns as Campaign[], hasMore };
  },
);

async function updateCampaignStatus(campaignId: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ is_active: isActive })
    .eq("id", campaignId);

  if (error) {
    console.error("Error updating campaign status:", error);
    throw new Error("Failed to update campaign status.");
  }

  revalidateTag("campaigns");
}

async function updateCampaignBudget(campaignId: string, budget: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ budget })
    .eq("id", campaignId);

  if (error) {
    console.error("Error updating campaign budget:", error);
    throw new Error("Failed to update campaign budget.");
  }

  revalidateTag("campaigns");
}

async function revalidateCampaigns() {
  revalidateTag("campaigns");
}

export {
  getCampaigns,
  updateCampaignStatus,
  updateCampaignBudget,
  revalidateCampaigns,
};
