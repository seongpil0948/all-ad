import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

export interface UserTeam {
  teamId: string;
  role: "master" | "team_mate" | "viewer";
  teamName: string;
}

/**
 * 사용자의 팀 정보를 가져오고, 팀이 없으면 자동으로 생성합니다.
 *
 * @param userId - 사용자 ID
 * @returns 사용자의 팀 정보 또는 null
 */
export async function getUserTeams(userId: string): Promise<UserTeam[]> {
  try {
    const supabase = await createClient();

    // 먼저 사용자가 마스터인 팀을 확인
    const { data: masterTeams, error: masterError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("master_user_id", userId);

    if (masterError) {
      log.error("Error fetching master teams", {
        error: masterError,
        userId,
      });
    }

    // 사용자가 멤버인 팀을 확인
    const { data: memberTeams, error: memberError } = await supabase
      .from("team_members")
      .select(
        `
        team_id,
        role,
        teams!inner(id, name)
      `,
      )
      .eq("user_id", userId);

    if (memberError) {
      log.error("Error fetching team memberships", {
        error: memberError,
        userId,
      });
    }

    const teams: UserTeam[] = [];

    // 마스터 팀 추가
    if (masterTeams) {
      masterTeams.forEach((team) => {
        teams.push({
          teamId: team.id,
          role: "master",
          teamName: team.name,
        });
      });
    }

    // 멤버 팀 추가
    if (memberTeams) {
      memberTeams.forEach((membership) => {
        const teamData = membership.teams as unknown as {
          id: string;
          name: string;
        };

        teams.push({
          teamId: membership.team_id,
          role: membership.role as "team_mate" | "viewer",
          teamName: teamData.name,
        });
      });
    }

    // 팀이 없으면 새로 생성
    if (teams.length === 0) {
      log.info("No teams found for user, creating new team", { userId });

      const { data: user } = await supabase.auth.getUser();

      if (!user.user) {
        log.error("Cannot create team: user not found", { userId });

        return [];
      }

      const { data: newTeam, error: createError } = await supabase
        .from("teams")
        .insert({
          name: user.user.email || "My Team",
          master_user_id: userId,
        })
        .select("id, name")
        .single();

      if (createError) {
        log.error("Error creating team for user", {
          error: createError,
          userId,
        });

        return [];
      }

      // 팀 멤버 테이블에도 추가
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: newTeam.id,
          user_id: userId,
          role: "master",
        });

      if (memberError) {
        log.warn("Error adding user to team_members", {
          error: memberError,
          userId,
          teamId: newTeam.id,
        });
      }

      teams.push({
        teamId: newTeam.id,
        role: "master",
        teamName: newTeam.name,
      });

      log.info("Successfully created team for user", {
        userId,
        teamId: newTeam.id,
        teamName: newTeam.name,
      });
    }

    return teams;
  } catch (error) {
    log.error("Unexpected error in getUserTeams", {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });

    return [];
  }
}

/**
 * 사용자의 첫 번째 팀 ID를 가져옵니다.
 *
 * @param userId - 사용자 ID
 * @returns 팀 ID 또는 null
 */
export async function getUserPrimaryTeamId(
  userId: string,
): Promise<string | null> {
  const teams = await getUserTeams(userId);

  if (teams.length === 0) {
    return null;
  }

  // 마스터인 팀을 우선적으로 반환
  const masterTeam = teams.find((team) => team.role === "master");

  if (masterTeam) {
    return masterTeam.teamId;
  }

  // 마스터 팀이 없으면 첫 번째 팀 반환
  return teams[0].teamId;
}

/**
 * 사용자가 특정 팀에 접근 권한이 있는지 확인합니다.
 *
 * @param userId - 사용자 ID
 * @param teamId - 팀 ID
 * @returns 접근 권한 여부
 */
export async function hasTeamAccess(
  userId: string,
  teamId: string,
): Promise<boolean> {
  const teams = await getUserTeams(userId);

  return teams.some((team) => team.teamId === teamId);
}
