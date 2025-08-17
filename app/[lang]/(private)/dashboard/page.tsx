import { redirect } from "next/navigation";
import { Metadata } from "next";

import { DashboardClient } from "./components/DashboardClient";

import { createClient } from "@/utils/supabase/server";
import { SyncButton } from "@/components/dashboard/SyncButton";
import { PageHeader } from "@/components/common";
import { Container } from "@/components/layouts/Container";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";
import { getCampaigns } from "./actions";
import { CampaignStats } from "@/types/campaign.types";
import { UserRole } from "@/types";
import { syncAllPlatformsAction } from "../integrated/actions";
import {
  savePlatformCredentials,
  deletePlatformCredentialById,
  togglePlatformCredentialById,
} from "../settings/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return {
    title: dict.dashboard.title,
    description: dict.dashboard.subtitle,
    openGraph: {
      title: `${dict.dashboard.title} - A.ll + Ad`,
      description: dict.dashboard.subtitle,
      url: `/${lang}/dashboard`,
      images: [
        {
          url: "/og-dashboard.png",
          width: 1200,
          height: 630,
          alt: dict.dashboard.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dict.dashboard.title} - A.ll + Ad`,
      description: dict.dashboard.subtitle,
      images: ["/og-dashboard.png"],
    },
  };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${lang}/login`);
  }

  let teamId = null;
  const { data: masterTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("master_user_id", user.id)
    .maybeSingle();

  if (masterTeam) {
    teamId = masterTeam.id;
  } else {
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      teamId = membership.team_id;
    }
  }

  if (!teamId) {
    const { data: newTeamId } = await supabase.rpc("create_team_for_user", {
      user_id: user.id,
    });

    teamId = newTeamId;
  }

  const { campaigns } = await getCampaigns({});

  const stats: CampaignStats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c) => c.is_active).length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
    totalSpend: campaigns.reduce((sum, c) => sum + (c.metrics?.cost || 0), 0),
    totalClicks: campaigns.reduce(
      (sum, c) => sum + (c.metrics?.clicks || 0),
      0,
    ),
    totalImpressions: campaigns.reduce(
      (sum, c) => sum + (c.metrics?.impressions || 0),
      0,
    ),
    platforms: Array.from(new Set(campaigns.map((c) => c.platform))).length,
  };

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  const { data: credentials } = await supabase
    .from("platform_credentials")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", teamId);

  let userRole: UserRole = "viewer";
  if (team?.master_user_id === user.id) {
    userRole = "master";
  } else {
    const member = teamMembers?.find((m) => m.user_id === user.id);
    if (member) {
      userRole = member.role as UserRole;
    }
  }

  const dashboardData = {
    user,
    team,
    credentials: credentials || [],
    campaigns,
    teamMembers: teamMembers || [],
    stats: { ...stats, connectedPlatforms: credentials?.length || 0 },
    userRole,
  };

  return (
    <Container className="py-8">
      <PageHeader
        pageSubtitle={dict.dashboard.subtitle}
        pageTitle={dict.dashboard.title}
        actions={
          <form action={syncAllPlatformsAction}>
            <SyncButton />
          </form>
        }
      />

      <DashboardClient
        dashboardData={dashboardData}
        teamId={teamId!}
        userId={user.id}
        onDelete={deletePlatformCredentialById}
        onSave={savePlatformCredentials}
        onToggle={togglePlatformCredentialById}
      />
    </Container>
  );
}
