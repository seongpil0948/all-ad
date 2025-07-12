"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { UserRole } from "@/types";
import { createTeamForUser } from "@/lib/data/teams";
import { getTeamInvitationEmailTemplate } from "@/utils/email-templates";

export async function inviteTeamMemberAction(email: string, role: UserRole) {
  try {
    const supabase = await createClient();
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
      .select("id, token")
      .eq("team_id", teamId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    let inviteToken: string;

    if (existingInvite) {
      log.info("Resending invitation email to existing invitation", {
        email,
        teamId,
      });
      inviteToken = existingInvite.token;
    } else {
      // Create new invitation
      const { data: invitation, error: invitationError } = await supabase
        .from("team_invitations")
        .insert({
          team_id: teamId,
          email,
          role: role === "master" ? "viewer" : role, // Can't invite as master
          invited_by: user.id,
        })
        .select("token")
        .single();

      if (invitationError) {
        log.error("Failed to create invitation", invitationError);
        throw invitationError;
      }

      inviteToken = invitation.token;
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${inviteToken}`;

    // Fetch inviter's profile and team name for the email
    const { data: inviterProfile, error: inviterProfileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    if (inviterProfileError) {
      log.error("Failed to fetch inviter profile", inviterProfileError);
      throw inviterProfileError;
    }

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single();

    if (teamError) {
      log.error("Failed to fetch team name", teamError);
      throw teamError;
    }

    const inviterName =
      inviterProfile?.full_name || inviterProfile?.email || "Someone";
    const teamName = team?.name || "Your Team";

    // Generate email content
    const emailSubject = `You're invited to join ${teamName} on AllAd!`;
    const emailHtml = getTeamInvitationEmailTemplate({
      inviterName,
      teamName,
      invitationLink: inviteUrl,
    });

    // Send email via Supabase Edge Function
    const { data: edgeFunctionResponse, error: edgeFunctionError } =
      await supabase.functions.invoke("resend", {
        body: {
          to: email,
          subject: emailSubject,
          html: emailHtml,
        },
      });

    if (edgeFunctionError) {
      log.error(
        "Failed to send invitation email via Edge Function",
        edgeFunctionError,
      );
    } else {
      log.info("Invitation email sent successfully via Edge Function", {
        email,
        response: edgeFunctionResponse,
      });
    }

    log.info("Team invitation processed successfully", {
      email,
      role,
      teamId,
      token: inviteToken,
      isResend: !!existingInvite,
    });

    revalidatePath("/team");

    return {
      success: true,
      message: existingInvite
        ? `초대 이메일이 다시 발송되었습니다.`
        : `초대 링크가 생성되었습니다.`,
      inviteUrl,
    };
  } catch (error) {
    log.error(
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
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Check if user is master and owns the team member
    const { data: teamMember } = await supabase
      .from("team_members")
      .select(
        `
        team_id,
        teams!inner (
          master_user_id
        )
      `,
      )
      .eq("id", memberId)
      .single();

    if (!teamMember) {
      throw new Error("Team member not found");
    }

    // Type assertion for the joined data
    const teamData = teamMember.teams as unknown as {
      master_user_id: string;
    };

    if (teamData.master_user_id !== user.id) {
      throw new Error("Only team master can update roles");
    }

    if (!teamMember.team_id) {
      throw new Error("Team member does not have a valid team_id");
    }

    const { error } = await supabase
      .from("team_members")
      .update({ role })
      .eq("id", memberId)
      .eq("team_id", teamMember.team_id); // Additional safety check

    if (error) {
      log.error("Failed to update team member role", error);
      throw error;
    }

    log.info("Team member role updated", { memberId, role });

    revalidatePath("/team");

    return { success: true, message: "권한이 성공적으로 변경되었습니다." };
  } catch (error) {
    log.error(
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
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    // Check if user is master and owns the team member
    const { data: teamMember } = await supabase
      .from("team_members")
      .select(
        `
        team_id,
        teams!inner (
          master_user_id
        )
      `,
      )
      .eq("id", memberId)
      .single();

    if (!teamMember) {
      throw new Error("Team member not found");
    }

    // Type assertion for the joined data
    const teamData = teamMember.teams as unknown as {
      master_user_id: string;
    };

    if (teamData.master_user_id !== user.id) {
      throw new Error("Only team master can remove members");
    }

    if (!teamMember.team_id) {
      throw new Error("Team member does not have a valid team_id");
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)
      .eq("team_id", teamMember.team_id); // Additional safety check

    if (error) {
      log.error("Failed to remove team member", error);
      throw error;
    }

    log.info("Team member removed", { memberId });

    revalidatePath("/team");

    return { success: true, message: "팀원이 성공적으로 제거되었습니다." };
  } catch (error) {
    log.error(
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
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user logged in");
    }

    const result = await createTeamForUser(user.id);

    revalidatePath("/team");

    return result;
  } catch (error) {
    log.error(
      "Error in createTeamForUserAction",
      error instanceof Error ? error : new Error(String(error)),
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create team",
    };
  }
}

export async function syncAllPlatformDataAction() {
  try {
    // Import DataSyncService only when needed to avoid client/server issues
    const { DataSyncService } = await import(
      "@/services/sync/data-sync.service"
    );
    const dataSyncService = new DataSyncService();
    const result = await dataSyncService.syncAllPlatformData();

    revalidatePath("/team");

    return result;
  } catch (error) {
    log.error(
      "Error in syncAllPlatformDataAction",
      error instanceof Error ? error : new Error(String(error)),
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync data",
    };
  }
}
