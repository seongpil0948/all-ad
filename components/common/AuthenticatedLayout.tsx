"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { LoadingState } from "./LoadingState";

import { useAuth } from "@/hooks/use-auth";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  requiredRole?: "master" | "team_mate" | "viewer";
}

export function AuthenticatedLayout({
  children,
  requiredRole: _requiredRole,
}: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  // TODO: Add role checking logic here if needed
  // if (requiredRole && user.role !== requiredRole) {
  //   return <ErrorState message="권한이 없습니다." />;
  // }

  return <>{children}</>;
}
