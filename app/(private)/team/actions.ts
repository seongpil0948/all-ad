"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { UserRole } from "@/types/database.types";
import logger from "@/utils/logger";

export async function inviteTeamMemberAction(email: string, role: UserRole) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Get user's team and role
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .maybeSingle();

    const teamId = membership?.team_id || masterTeam?.id;
    const userRole = masterTeam ? "master" : membership?.role;

    if (!teamId) {
      throw new Error("No team found");
    }

    if (userRole !== "master" && userRole !== "team_mate") {
      throw new Error("Insufficient permissions to invite members");
    }

    // Check if user with this email is already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("profiles!inner(email)")
      .eq("team_id", teamId)
      .eq("profiles.email", email)
      .maybeSingle();

    if (existingMember) {
      throw new Error("User is already a team member");
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("team_id", teamId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      throw new Error("An invitation has already been sent to this email");
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        email,
        role: role === "master" ? "viewer" : role, // Can't invite as master
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (error) {
      logger.error("Failed to create invitation", error);
      throw error;
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invitation.token}`;

    logger.info("Team invitation created successfully", {
      email,
      role,
      teamId,
      token: invitation.token,
    });

    revalidatePath("/team");

    return {
      success: true,
      message: `초대 링크가 생성되었습니다.`,
      inviteUrl,
    };
  } catch (error) {
    logger.error(
      "Error in inviteTeamMemberAction",
      error instanceof Error ? error : new Error(String(error)),
    );

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to invite team member",
    };
  }
}

export async function updateTeamMemberRoleAction(
  memberId: string,
  role: UserRole,
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Check if user is master
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .maybeSingle();

    if (!masterTeam) {
      throw new Error("Only team master can update roles");
    }

    const { error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("id", memberId);

    if (error) {
      logger.error("Failed to update team member role", error);
      throw error;
    }

    logger.info("Team member role updated", { memberId, role });

    revalidatePath("/team");

    return { success: true, message: "권한이 성공적으로 변경되었습니다." };
  } catch (error) {
    logger.error(
      "Error in updateTeamMemberRoleAction",
      error instanceof Error ? error : new Error(String(error)),
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function removeTeamMemberAction(memberId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Check if user is master
    const { data: masterTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("master_user_id", user.id)
      .maybeSingle();

    if (!masterTeam) {
      throw new Error("Only team master can remove members");
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      logger.error("Failed to remove team member", error);
      throw error;
    }

    logger.info("Team member removed", { memberId });

    revalidatePath("/team");

    return { success: true, message: "팀원이 성공적으로 제거되었습니다." };
  } catch (error) {
    logger.error(
      "Error in removeTeamMemberAction",
      error instanceof Error ? error : new Error(String(error)),
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}

export async function createTeamForUserAction() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    const { data: newTeamId, error } = await supabase.rpc(
      "create_team_for_user",
      { user_id: user.id },
    );

    if (error) {
      logger.error("Failed to create team", error);
      throw error;
    }

    logger.info("Team created successfully", { teamId: newTeamId });

    revalidatePath("/team");

    return { success: true, teamId: newTeamId };
  } catch (error) {
    logger.error(
      "Error in createTeamForUserAction",
      error instanceof Error ? error : new Error(String(error)),
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create team",
    };
  }
}
