"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { useDictionary } from "@/hooks/use-dictionary";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function AuthenticatedLayout({
  children,
  requiredRole,
}: AuthenticatedLayoutProps) {
  const { dictionary: dict } = useDictionary();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // Fetch user role when user is available
  useEffect(() => {
    async function fetchUserRole() {
      if (!user) return;

      setRoleLoading(true);
      try {
        const supabase = createClient();
        const { data: teamMember, error } = await supabase
          .from("team_members")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          setUserRole(null);
        } else {
          setUserRole(teamMember.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    }

    fetchUserRole();
  }, [user]);

  if (loading || roleLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  // Role-based access control
  if (requiredRole && userRole !== requiredRole) {
    // Define role hierarchy: master > team_mate > viewer
    const roleHierarchy: Record<UserRole, number> = {
      master: 3,
      team_mate: 2,
      viewer: 1,
    };

    const userRoleLevel = userRole ? roleHierarchy[userRole] : 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <ErrorState
          message={
            dict.errors.forbiddenRole
              ? dict.errors.forbiddenRole.replace("{{role}}", requiredRole)
              : dict.errors.forbidden
          }
          title={dict.errors.forbidden}
        />
      );
    }
  }

  return (
    <div aria-label={dict.common.mainContent} role="main">
      {children}
    </div>
  );
}
