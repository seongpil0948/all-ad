import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@heroui/button";

import InviteAcceptClient from "./InviteAcceptClient";
import LogoutButton from "./LogoutButton";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { getDictionary, type Locale } from "@/app/[lang]/dictionaries";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

async function getInvitationDetails(token: string) {
  const supabase = await createClient();

  log.info("Fetching invitation details", { token });

  // First, let's debug all tokens to see what's actually in the database
  const { data: debugTokens, error: debugError } = await supabase.rpc(
    "debug_get_all_invitation_tokens",
  );

  log.info("Debug: All invitation tokens", {
    tokens: debugTokens,
    error: debugError
      ? {
          message: debugError.message,
          code: debugError.code,
          details: debugError.details,
          hint: debugError.hint,
        }
      : null,
  });

  // Use RPC function to get invitation by token
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "get_invitation_by_token",
    { invitation_token: token },
  );

  if (rpcError) {
    log.error("RPC error fetching invitation", {
      token,
      error: rpcError.message,
      code: rpcError.code,
      details: rpcError.details,
      hint: rpcError.hint,
    });

    return { invitation: null, error: rpcError };
  }

  if (!rpcResult) {
    log.error("No invitation found with RPC", { token, rpcResult });

    return { invitation: null, error: new Error("Invitation not found") };
  }

  // Transform the RPC result to match expected format
  const invitation = {
    ...rpcResult,
    teams: { name: rpcResult.team_name },
    profiles: { email: rpcResult.invited_by_email },
  };

  log.info("Successfully fetched invitation via RPC", {
    id: invitation.id,
    email: invitation.email,
    status: invitation.status,
  });

  return { invitation, error: null };
}

// Disable caching for this page to ensure fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const dict = await getDictionary("en" as Locale);
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get invitation details
  const { invitation, error } = await getInvitationDetails(token);

  if (error || !invitation) {
    log.error("Invalid invitation token: " + token, error ?? {});
    notFound();
  }

  // Check invitation status
  if (invitation.status !== "pending") {
    // If user is logged in and invitation is already accepted
    if (user && invitation.status === "accepted") {
      // Check if the logged-in user matches the invitation email
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();

      if (userProfile?.email === invitation.email) {
        // Same user - redirect to dashboard
        redirect("/dashboard");
      } else {
        // Different user - need to logout and signup with correct email
        return (
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
              <h1 className="text-2xl font-bold mb-4">
                {dict.invite.alreadyUsed.title}
              </h1>
              <p className="text-default-500 mb-4">
                {dict.invite.alreadyUsed.sentToPrefix}{" "}
                <strong>{invitation.email}</strong>{" "}
                {dict.invite.alreadyUsed.acceptedSuffix}
              </p>
              <p className="text-default-500 mb-4">
                {dict.invite.alreadyUsed.loggedInAsPrefix}{" "}
                <strong>{userProfile?.email}</strong>.
              </p>
              <p className="text-default-500 mb-6">
                {dict.invite.alreadyUsed.instructions}
              </p>
              <LogoutButton inviteEmail={invitation.email} />
            </div>
          </div>
        );
      }
    }

    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {dict.invite.alreadyUsed.title}
          </h1>
          <div className="text-default-500">
            {dict.invite.alreadyUsed.statusPrefix} {invitation.status}.
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">
            {dict.invite.expired.title}
          </h1>
          <div className="text-default-500">{dict.invite.expired.message}</div>
        </div>
      </div>
    );
  }

  // If user is not logged in, check if invited user account exists
  if (!user) {
    // Check if an account with the invitation email exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", invitation.email)
      .maybeSingle();

    if (existingUser) {
      // Account exists - redirect to login with password reset option
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">
              {dict.invite.accountExists.title}
            </h1>
            <p className="text-default-500 mb-4">
              {dict.invite.accountExists.prefix}{" "}
              <strong>{invitation.email}</strong>{" "}
              {dict.invite.accountExists.suffix}
            </p>
            <p className="text-default-500 mb-6">
              {dict.invite.accountExists.description}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                color="primary"
                onPress={() =>
                  (window.location.href = `/login?email=${encodeURIComponent(invitation.email)}`)
                }
              >
                {dict.invite.actions.login}
              </Button>
              <Button
                className="w-full"
                color="default"
                variant="bordered"
                onPress={() =>
                  (window.location.href = `/forgot-password?email=${encodeURIComponent(invitation.email)}`)
                }
              >
                {dict.invite.actions.resetPassword}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // No account exists - show invitation preview page that redirects to signup
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <InviteAcceptClient
          invitation={{
            ...invitation,
            teamName: invitation.teams?.name || "Unknown Team",
            inviterName:
              invitation.profiles?.full_name ||
              invitation.profiles?.email ||
              "Someone",
          }}
          isPreview={true}
          token={token}
        />
      </div>
    );
  }

  // Check if user email matches invitation email
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  // Check if user is already a member of the team
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("team_id", invitation.team_id)
    .maybeSingle();

  // Check if user is the master of the team
  const { data: teamMaster } = await supabase
    .from("teams")
    .select("master_user_id")
    .eq("id", invitation.team_id)
    .eq("master_user_id", user.id)
    .maybeSingle();

  // If user is already a member, mark invitation as accepted and redirect
  if (existingMember || teamMaster) {
    // Update invitation status to accepted
    await supabase
      .from("team_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    redirect("/dashboard");
  }

  if (userProfile?.email !== invitation.email) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">
            {dict.invite.mismatch.title}
          </h1>
          <div className="text-default-500 mb-2">
            {dict.invite.mismatch.sentToPrefix}{" "}
            <strong>{invitation.email}</strong>
          </div>
          <div className="text-default-500 mb-4">
            {dict.invite.mismatch.loggedInAsPrefix}{" "}
            <strong>{userProfile?.email}</strong>
          </div>
          <div className="text-default-500 mb-6">
            {dict.invite.mismatch.optionsTitle}
          </div>
          <div className="space-y-3">
            <div className="bg-default-100 p-4 rounded-lg">
              <div className="text-sm text-default-600 mb-2">
                <strong>{dict.invite.mismatch.option1Title}</strong>{" "}
                {dict.invite.mismatch.option1Desc}
              </div>
              <div className="flex gap-2">
                <LogoutButton inviteEmail={invitation.email} />
              </div>
            </div>
            <div className="bg-default-100 p-4 rounded-lg">
              <div className="text-sm text-default-600 mb-2">
                <strong>{dict.invite.mismatch.option2Title}</strong>{" "}
                {dict.invite.mismatch.option2Desc}
              </div>
              <div className="text-xs text-warning mb-2">
                {dict.invite.mismatch.warning}
              </div>
              <InviteAcceptClient
                invitation={{
                  ...invitation,
                  teamName: invitation.teams?.name || dict.invite.unknownTeam,
                  inviterName:
                    invitation.profiles?.email || dict.invite.someone,
                }}
                token={token}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">{dict.common.loading}</div>
        </div>
      }
    >
      <InviteAcceptClient
        invitation={{
          ...invitation,
          teamName: invitation.teams?.name || dict.invite.unknownTeam,
          inviterName:
            invitation.profiles?.full_name ||
            invitation.profiles?.email ||
            dict.invite.someone,
        }}
        token={token}
      />
    </Suspense>
  );
}
