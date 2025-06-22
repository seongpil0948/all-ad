"use client";

import { lazy, Suspense } from "react";
import { CircularProgress } from "@heroui/progress";

import { DashboardDataProvider } from "../DashboardDataProvider";

import { Campaign, CampaignStats } from "@/types/campaign.types";
import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";
import { Database } from "@/types/supabase.types";

// Lazy load heavy components
const CampaignDashboard = lazy(() =>
  import("@/components/dashboard/CampaignDashboard").then((module) => ({
    default: module.CampaignDashboard,
  })),
);

const MultiAccountPlatformManager = lazy(() =>
  import("@/components/features/platform/MultiAccountPlatformManager").then(
    (module) => ({
      default: module.MultiAccountPlatformManager,
    }),
  ),
);

type PlatformCredential =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

interface DashboardClientProps {
  initialCampaigns: Campaign[];
  initialStats: CampaignStats;
  showPlatformManager: boolean;
  credentials: PlatformCredential[];
  teamId: string;
  userId: string;
  onDelete: (id: string) => Promise<void>;
  onSave: (
    platform: PlatformType,
    credentials: CredentialValues,
  ) => Promise<void>;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <CircularProgress aria-label="Loading..." color="primary" size="lg" />
  </div>
);

export function DashboardClient({
  initialCampaigns,
  initialStats,
  showPlatformManager,
  credentials,
  teamId,
  userId,
  onDelete,
  onSave,
  onToggle,
}: DashboardClientProps) {
  return (
    <>
      {/* Platform connection section - shown when no campaigns */}
      {showPlatformManager && (
        <div className="mb-8">
          <Suspense fallback={<LoadingFallback />}>
            <MultiAccountPlatformManager
              credentials={credentials}
              teamId={teamId}
              userId={userId}
              onDelete={onDelete}
              onSave={onSave}
              onToggle={onToggle}
            />
          </Suspense>
        </div>
      )}

      <DashboardDataProvider
        initialCampaigns={initialCampaigns}
        initialStats={initialStats}
      >
        <Suspense fallback={<LoadingFallback />}>
          <CampaignDashboard />
        </Suspense>
      </DashboardDataProvider>
    </>
  );
}
