"use client";

import { lazy, Suspense, useState } from "react";
import { CircularProgress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { FaChartBar, FaKey, FaUsers } from "react-icons/fa";
import { User } from "@supabase/supabase-js";

import { IntegratedDataProvider } from "../IntegratedDataProvider";

import { PlatformType } from "@/types";
import { CredentialValues } from "@/types/credentials.types";
import {
  Team,
  PlatformCredential,
  UserRole,
  TeamMemberWithProfile,
} from "@/types";
import { Campaign as AppCampaign, CampaignStats } from "@/types/campaign.types";

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

const TeamManagement = lazy(() =>
  import("@/components/team/TeamManagement").then((module) => ({
    default: module.TeamManagement,
  })),
);

interface IntegratedDashboardData {
  user: User;
  team: Team;
  credentials: PlatformCredential[];
  campaigns: AppCampaign[];
  teamMembers: TeamMemberWithProfile[];
  stats: CampaignStats & {
    connectedPlatforms: number;
  };
  userRole: UserRole;
}

interface DashboardClientProps {
  dashboardData: IntegratedDashboardData;
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
  dashboardData,
  teamId,
  userId,
  onDelete,
  onSave,
  onToggle,
}: DashboardClientProps) {
  const [selectedTab, setSelectedTab] = useState("campaigns");
  const { stats, campaigns, credentials } = dashboardData;

  return (
    <IntegratedDataProvider initialData={dashboardData}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary-100">
                <FaChartBar className="text-primary-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-small text-default-500">전체 캠페인</p>
                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success-100">
                <FaChartBar className="text-success-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-small text-default-500">활성 캠페인</p>
                <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-warning-100">
                <FaKey className="text-warning-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-small text-default-500">연동 플랫폼</p>
                <p className="text-2xl font-bold">{stats.connectedPlatforms}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary-100">
                <FaUsers className="text-secondary-500 w-6 h-6" />
              </div>
              <div>
                <p className="text-small text-default-500">총 예산</p>
                <p className="text-2xl font-bold">
                  ₩{stats.totalBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        aria-label="대시보드 탭"
        classNames={{
          tabList:
            "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary",
        }}
        color="primary"
        selectedKey={selectedTab}
        variant="underlined"
        onSelectionChange={(key) => setSelectedTab(key as string)}
      >
        <Tab
          key="campaigns"
          title={
            <div className="flex items-center space-x-2">
              <FaChartBar />
              <span>캠페인 관리</span>
            </div>
          }
        >
          <Card className="mt-6">
            <CardBody>
              <Suspense fallback={<LoadingFallback />}>
                <CampaignDashboard />
              </Suspense>
            </CardBody>
          </Card>
        </Tab>

        <Tab
          key="platforms"
          title={
            <div className="flex items-center space-x-2">
              <FaKey />
              <span>플랫폼 연동</span>
            </div>
          }
        >
          <div className="mt-6">
            <Suspense fallback={<LoadingFallback />}>
              <MultiAccountPlatformManager
                credentials={credentials as any}
                teamId={teamId}
                userId={userId}
                onDelete={onDelete}
                onSave={onSave}
                onToggle={onToggle}
              />
            </Suspense>
          </div>
        </Tab>

        <Tab
          key="team"
          title={
            <div className="flex items-center space-x-2">
              <FaUsers />
              <span>팀 관리</span>
            </div>
          }
        >
          <Card className="mt-6">
            <CardBody>
              <Suspense fallback={<LoadingFallback />}>
                <TeamManagement />
              </Suspense>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </IntegratedDataProvider>
  );
}
