import { notFound } from "next/navigation";
import { Suspense } from "react";

import InviteAcceptClient from "./InviteAcceptClient";

import { createClient } from "@/utils/supabase/server";
import logger from "@/utils/logger";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

async function getInvitationDetails(token: string) {
  const supabase = await createClient();

  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .select(
      `
      *,
      teams(name),
      profiles!invited_by(full_name, email)
    `
    )
    .eq("token", token)
    .single();

  return { invitation, error };
}

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
    logger.error("Invalid invitation token: " + token, error || undefined);
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
