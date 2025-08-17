import { Suspense } from "react";

import { CampaignDashboardClient } from "./CampaignDashboardClient";

import {
  getCampaigns,
  getCampaignStats,
  preloadCampaignData,
} from "@/lib/data/campaigns";
import {
  TableSkeleton,
  MetricCardSkeleton,
} from "@/components/common/skeletons";

interface CampaignDashboardServerProps {
  teamId: string;
}

// Stats component with its own suspense boundary
async function CampaignStats({ teamId }: { teamId: string }) {
  const stats = await getCampaignStats(teamId);

  const GAP = "gap-4" as const;
  const LABELS = {
    total: "총 캠페인",
    active: "활성 캠페인",
    budget: "총 예산",
    platforms: "연동 플랫폼",
  } as const;

  return (
    <AutoGrid minItemWidth={240} gap={GAP}>
      <div className="stat-card">
        <h3>{LABELS.total}</h3>
        <p>{stats.totalCampaigns}</p>
      </div>
      <div className="stat-card">
        <h3>{LABELS.active}</h3>
        <p>{stats.activeCampaigns}</p>
      </div>
      <div className="stat-card">
        <h3>{LABELS.budget}</h3>
        <p>{stats.totalBudget.toLocaleString()}</p>
      </div>
      <div className="stat-card">
        <h3>{LABELS.platforms}</h3>
        <p>{stats.platforms}</p>
      </div>
    </AutoGrid>
  );
}

// Main server component with streaming support
export async function CampaignDashboardServer({
  teamId,
}: CampaignDashboardServerProps) {
  // Preload data in parallel
  preloadCampaignData(teamId);

  // Fetch campaigns and stats in parallel
  const [campaigns, stats] = await Promise.all([
    getCampaigns(teamId),
    getCampaignStats(teamId),
  ]);

  return (
    <div className="space-y-6">
      {/* Stream stats separately */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        }
      >
        <CampaignStats teamId={teamId} />
      </Suspense>

      {/* Stream campaign table separately */}
      <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
        <CampaignDashboardClient
          initialCampaigns={campaigns}
          initialStats={stats}
        />
      </Suspense>
    </div>
  );
}
import { AutoGrid } from "@/components/common/AutoGrid";
