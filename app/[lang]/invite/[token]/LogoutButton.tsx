"use client";

import { Button } from "@heroui/button";

import { clientLogout } from "@/app/[lang]/(auth)/login/client-actions";

interface LogoutButtonProps {
  inviteEmail: string;
}

export default function LogoutButton({ inviteEmail }: LogoutButtonProps) {
  const handleLogout = async () => {
    await clientLogout();
    // Redirect to login with the invite email pre-filled
    window.location.href = `/login?email=${encodeURIComponent(inviteEmail)}`;
  };

  return (
    <Button color="primary" size="sm" onPress={handleLogout}>
      Log out and sign in with correct email
    </Button>
  );
}
