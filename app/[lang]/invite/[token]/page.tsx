import { notFound } from "next/navigation";
import { Suspense } from "react";

import InviteAcceptClient from "./InviteAcceptClient";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

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

  if (!rpcResult || !rpcResult.invitation) {
    log.error("No invitation found with RPC", { token, rpcResult });

    return { invitation: null, error: new Error("Invitation not found") };
  }

  // Transform the RPC result to match expected format
  const invitation = {
    ...rpcResult.invitation,
    teams: rpcResult.team,
    profiles: rpcResult.inviter,
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invitation Already Used</h1>
          <p className="text-default-500">
            This invitation has already been {invitation.status}.
          </p>
        </div>
      </div>
    );
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invitation Expired</h1>
          <p className="text-default-500">
            This invitation has expired. Please request a new invitation.
          </p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show invitation details and redirect to signup
  if (!user) {
    // Show invitation preview page that redirects to signup
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

  if (userProfile?.email !== invitation.email) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Email Mismatch</h1>
          <p className="text-default-500 mb-2">
            This invitation was sent to <strong>{invitation.email}</strong>
          </p>
          <p className="text-default-500">
            You are currently logged in as <strong>{userProfile?.email}</strong>
          </p>
          <p className="text-default-500 mt-4">
            Please log in with the correct email address to accept this
            invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      }
    >
      <InviteAcceptClient
        invitation={{
          ...invitation,
          teamName: invitation.teams?.name || "Unknown Team",
          inviterName:
            invitation.profiles?.full_name ||
            invitation.profiles?.email ||
            "Someone",
        }}
        token={token}
      />
    </Suspense>
  );
}
