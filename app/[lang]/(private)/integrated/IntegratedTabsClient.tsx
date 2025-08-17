"use client";

import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { FaChartBar, FaKey, FaUsers } from "react-icons/fa";
import { useShallow } from "zustand/shallow";

import { Json } from "@/types/supabase.types";
import { CampaignDashboardClient } from "@/components/dashboard/CampaignDashboardClient";
import { MultiAccountPlatformManager } from "@/components/features/platform/MultiAccountPlatformManager";
import { TeamManagement } from "@/components/team/TeamManagement";
import { usePlatformStore, useTeamStore, useAuthStore } from "@/stores";
import { CredentialValues } from "@/types/credentials.types";
import { PlatformType, Campaign, CampaignStats } from "@/types";
import { Database } from "@/types/supabase.types";
import { useDictionary } from "@/hooks/use-dictionary";

type PlatformCredentialRow =
  Database["public"]["Tables"]["platform_credentials"]["Row"];

interface IntegratedTabsClientProps {
  initialCampaigns: Campaign[];
  initialStats: CampaignStats;
}

export default function IntegratedTabsClient({
  initialCampaigns,
  initialStats,
}: IntegratedTabsClientProps) {
  const { dictionary: dict } = useDictionary();
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
      account_id: cred.account_id,
      account_name: cred.account_name || null,
      credentials: cred.credentials as Json,
      data: (cred.data || {}) as Json,
      access_token: cred.access_token || null,
      refresh_token: cred.refresh_token || null,
      expires_at: cred.expires_at || null,
      scope: cred.scope || null,
      is_active: cred.is_active,
      created_by: cred.created_by || user?.id || "",
      last_synced_at: cred.last_synced_at || null,
      error_message: cred.error_message || null,
      created_at: cred.created_at,
      updated_at: cred.updated_at,
    }),
  );

  return (
    <Tabs
      aria-label={dict.dashboard.tabs.aria}
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
            <span>{dict.dashboard.tabs.campaigns}</span>
          </div>
        }
      >
        <Card className="mt-6">
          <CardBody>
            <CampaignDashboardClient
              initialCampaigns={initialCampaigns}
              initialStats={initialStats}
            />
          </CardBody>
        </Card>
      </Tab>

      <Tab
        key="platforms"
        title={
          <div className="flex items-center space-x-2">
            <FaKey />
            <span>{dict.dashboard.tabs.platforms}</span>
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
            onToggle={async (credentialId: string) => {
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
            <span>{dict.dashboard.tabs.team}</span>
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
