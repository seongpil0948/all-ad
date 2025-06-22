"use client";

import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { FaChartBar, FaKey, FaUsers } from "react-icons/fa";
import { useShallow } from "zustand/shallow";

import { CampaignDashboard } from "@/components/dashboard/CampaignDashboard";
import { PlatformCredentialsManager } from "@/components/features/platform/PlatformCredentialsManager";
import { TeamManagement } from "@/components/team/TeamManagement";
import { usePlatformStore, useTeamStore, useAuthStore } from "@/stores";
import { CredentialValues } from "@/types/credentials.types";

export default function IntegratedTabsClient() {
  const {
    credentials,
    addCredential,
    deleteCredential,
    toggleCredentialStatus,
  } = usePlatformStore(
    useShallow((state) => ({
      credentials: state.credentials,
      addCredential: state.addCredential,
      deleteCredential: state.deleteCredential,
      toggleCredentialStatus: state.toggleCredentialStatus,
    })),
  );

  const currentTeam = useTeamStore(useShallow((state) => state.currentTeam));
  const user = useAuthStore(useShallow((state) => state.user));

  return (
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
      variant="underlined"
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
            <CampaignDashboard />
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
        <Card className="mt-6">
          <CardBody>
            <PlatformCredentialsManager
              credentials={credentials
                .filter((c) => c.created_by !== undefined)
                .map((c) => ({
                  id: c.id,
                  teamId: c.team_id,
                  platform: c.platform,
                  credentials: c.credentials as CredentialValues,
                  isActive: c.is_active,
                  createdAt: c.created_at,
                  updatedAt: c.updated_at,
                  lastSyncAt: c.synced_at || null,
                }))}
              teamId={currentTeam?.id || ""}
              userId={user?.id || ""}
              onDelete={async (platform) => {
                const credential = credentials.find(
                  (c) => c.platform === platform,
                );

                if (credential) {
                  await deleteCredential(credential.id);
                }
              }}
              onSave={addCredential}
              onToggle={async (platform, _isActive) => {
                const credential = credentials.find(
                  (c) => c.platform === platform,
                );

                if (credential) {
                  await toggleCredentialStatus(credential.id);
                }
              }}
            />
          </CardBody>
        </Card>
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
            <TeamManagement />
          </CardBody>
        </Card>
      </Tab>
    </Tabs>
  );
}
