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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stat-card">
        <h3>총 캠페인</h3>
        <p>{stats.totalCampaigns}</p>
      </div>
      <div className="stat-card">
        <h3>활성 캠페인</h3>
        <p>{stats.activeCampaigns}</p>
      </div>
      <div className="stat-card">
        <h3>총 예산</h3>
        <p>{stats.totalBudget.toLocaleString()}원</p>
      </div>
      <div className="stat-card">
        <h3>연동 플랫폼</h3>
        <p>{stats.platforms}개</p>
      </div>
    </div>
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
