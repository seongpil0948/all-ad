"use client";

import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { FaChartBar, FaKey, FaUsers } from "react-icons/fa";
import { useShallow } from "zustand/shallow";

import { CampaignDashboard } from "@/components/dashboard/CampaignDashboard";
import { MultiAccountPlatformManager } from "@/components/features/platform/MultiAccountPlatformManager";
import { TeamManagement } from "@/components/team/TeamManagement";
import { usePlatformStore, useTeamStore, useAuthStore } from "@/stores";
import { CredentialValues } from "@/types/credentials.types";
import { PlatformType } from "@/types";
import { Database } from "@/types/supabase.types";

type PlatformCredentialRow =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

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

  // Map credentials to the format expected by MultiAccountPlatformManager
  const mappedCredentials: PlatformCredentialRow[] = credentials.map(
    (cred) => ({
      id: cred.id,
      team_id: cred.team_id,
      platform: cred.platform,
      credentials: cred.credentials as any,
      is_active: cred.is_active,
      created_by: cred.created_by || null,
      created_at: cred.created_at,
      updated_at: cred.updated_at,
      synced_at: cred.synced_at || null,
      last_sync_at: cred.last_sync_at || null,
      // Map additional fields that might be expected
      account_id: (cred.credentials as any)?.account_id || cred.id,
      account_name:
        (cred.credentials as any)?.account_name || `${cred.platform} Account`,
      data: cred.credentials as any,
      last_synced_at: cred.last_sync_at || null,
      user_id: cred.created_by || user?.id || null,
    }),
  );

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
        <div className="mt-6">
          <MultiAccountPlatformManager
            credentials={mappedCredentials}
            teamId={currentTeam?.id || ""}
            userId={user?.id || ""}
            onDelete={async (credentialId: string) => {
              await deleteCredential(credentialId);
            }}
            onSave={async (platform: PlatformType, creds: CredentialValues) => {
              await addCredential(platform, creds);
            }}
            onToggle={async (credentialId: string, isActive: boolean) => {
              await toggleCredentialStatus(credentialId);
            }}
          />
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
            <TeamManagement />
          </CardBody>
        </Card>
      </Tab>
    </Tabs>
  );
}
