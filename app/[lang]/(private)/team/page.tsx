import { TeamDataProvider } from "./TeamDataProvider";

import { TeamManagement } from "@/components/team/TeamManagement";
import { PageHeader } from "@/components/common";
import { Container } from "@/components/layouts/Container";
import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { Team, UserRole, TeamMemberWithProfile } from "@/types";
import { Database } from "@/types/supabase.types";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  const supabase = await createClient();

  // Get initial data on server side
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Container className="py-6">
        <PageHeader
          pageSubtitle={dict.dashboard.loginRequired}
          pageTitle={dict.team.title}
        />
      </Container>
    );
  }

  // Fetch initial team data
  let currentTeam: Team | null = null;
  let userRole: UserRole | null = null;
  let teamMembers: TeamMemberWithProfile[] | null = null;

  try {
    // Check if user is master of any team
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("*")
      .eq("master_user_id", user.id)
      .maybeSingle();

    if (masterTeam) {
      currentTeam = masterTeam;
      userRole = "master";
    } else {
      // Get user's team membership
      const { data: membership } = await supabase
        .from("team_members")
        .select("*, teams(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership && membership.teams) {
        currentTeam = membership.teams;
        userRole = membership.role;
      }
    }

    // Fetch team members if team exists
    if (currentTeam) {
      const { data } = await supabase.rpc("get_team_members_with_profiles", {
        team_id_param: currentTeam.id,
      });

      interface TeamMemberRPCResult {
        id: string;
        team_id: string;
        user_id: string;
        role: Database["public"]["Enums"]["user_role"];
        invited_by: string;
        joined_at: string;
        profile_id: string;
        email: string;
        full_name: string;
        avatar_url: string;
      }

      if (data) {
        teamMembers = (data as TeamMemberRPCResult[]).map(
          (member) =>
            ({
              id: member.id,
              team_id: member.team_id,
              user_id: member.user_id,
              role: member.role as UserRole,
              invited_by: member.invited_by,
              joined_at: member.joined_at,
              profiles: member.profile_id
                ? {
                    id: member.profile_id,
                    email: member.email,
                    full_name: member.full_name,
                    avatar_url: member.avatar_url,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }
                : null,
            }) as TeamMemberWithProfile,
        );
      }
    }
  } catch (error) {
    log.error(`Error fetching team data: ${JSON.stringify(error)}`);
  }

  return (
    <Container className="py-6">
      <PageHeader
        pageSubtitle={dict.team.subtitle}
        pageTitle={dict.team.title}
      />
      <TeamDataProvider
        initialTeam={currentTeam}
        initialTeamMembers={teamMembers}
        initialUserRole={userRole}
      >
        <TeamManagement />
      </TeamDataProvider>
    </Container>
  );
}
