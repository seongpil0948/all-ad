"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

import { createClient } from "@/utils/supabase/client";
import logger from "@/utils/logger";

interface InviteAcceptClientProps {
  token: string;
  invitation: {
    email: string;
    role: string;
    teamName: string;
    inviterName: string;
  };
  isPreview?: boolean;
}

const roleLabels = {
  team_mate: "Team Mate",
  viewer: "Viewer",
};

export default function InviteAcceptClient({
  token,
  invitation,
  isPreview = false,
}: InviteAcceptClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (isPreview) {
      // If preview mode, redirect to signup with invitation email and token
      const signupUrl = `/signup?email=${encodeURIComponent(invitation.email)}&inviteToken=${token}&returnUrl=${encodeURIComponent(`/invite/${token}`)}`;

      router.push(signupUrl);

      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      logger.info("Accepting invitation", { token });

      // Call the RPC function to accept invitation
      const { data, error: acceptError } = await supabase.rpc(
        "accept_team_invitation",
        {
          invitation_token: token,
        },
      );

      if (acceptError) {
        logger.error("Failed to accept invitation", acceptError);
        throw new Error(acceptError.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      logger.info("Invitation accepted successfully", { teamId: data.team_id });

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      logger.error("Error accepting invitation", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    // Just redirect to home
    router.push("/");
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="text-center py-8">
            <FaCheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invitation Accepted!</h2>
            <p className="text-default-500">
              You have successfully joined the team. Redirecting to dashboard...
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <h1 className="text-2xl font-bold">Team Invitation</h1>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-4">
              <strong>{invitation.inviterName}</strong> has invited you to join
            </p>
            <h2 className="text-3xl font-bold mb-4">{invitation.teamName}</h2>
            <p className="text-default-500 mb-4">
              as a{" "}
              <Chip color="primary" size="sm" variant="flat">
                {roleLabels[invitation.role as keyof typeof roleLabels] ||
                  invitation.role}
              </Chip>
            </p>
          </div>

          {isPreview && (
            <p className="text-sm text-default-500 text-center">
              You&apos;ll need to create an account to accept this invitation.
            </p>
          )}

          {error && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FaTimesCircle className="text-danger flex-shrink-0" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              fullWidth
              color="default"
              isDisabled={isLoading}
              variant="bordered"
              onPress={handleDecline}
            >
              Decline
            </Button>
            <Button
              fullWidth
              color="primary"
              isLoading={isLoading}
              onPress={handleAccept}
            >
              {isPreview ? "Create Account" : "Accept Invitation"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
