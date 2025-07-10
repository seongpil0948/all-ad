"use server";

import { revalidatePath } from "next/cache";

import { UserRole } from "@/types";
import { TeamService } from "@/services/team/team.service";
import { DataSyncService } from "@/services/sync/data-sync.service";

const teamService = new TeamService();

export async function inviteTeamMemberAction(email: string, role: UserRole) {
  const result = await teamService.inviteTeamMember(email, role);

  revalidatePath("/team");

  return result;
}

export async function updateTeamMemberRoleAction(
  memberId: string,
  role: UserRole,
) {
  const result = await teamService.updateTeamMemberRole(memberId, role);

  revalidatePath("/team");

  return result;
}

export async function removeTeamMemberAction(memberId: string) {
  const result = await teamService.removeTeamMember(memberId);

  revalidatePath("/team");

  return result;
}

export async function createTeamForUserAction() {
  const result = await teamService.createTeamForUser();

  revalidatePath("/team");

  return result;
}

export async function syncAllPlatformDataAction() {
  const dataSyncService = new DataSyncService();
  const result = await dataSyncService.syncAllPlatformData();

  revalidatePath("/team");

  return result;
}
