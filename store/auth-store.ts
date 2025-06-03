// User authentication and role management store

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { User, UserRole, TeamPermissions } from "@/types";
import { createClient } from "@/utils/supabase/client";
import logger from "@/utils/logger";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;

  // Permission checks
  hasPermission: (permission: keyof TeamPermissions) => boolean;
  canAccessPlatform: (platformId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isLoading: false,
        error: null,

        setUser: (user) => {
          set({ user });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },

        setError: (error) => {
          set({ error });
        },

        signIn: async (email, password) => {
          const { setLoading, setError, setUser } = get();

          try {
            setLoading(true);
            setError(null);

            const supabase = createClient();
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) throw error;

            if (data.user) {
              // Fetch user profile with role
              const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single();

              if (profileError) throw profileError;

              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                role: profile.role || UserRole.VIEWER,
                createdAt: new Date(data.user.created_at),
                lastLoginAt: new Date(),
              };

              setUser(user);
              logger.info("User signed in", {
                userId: user.id,
                role: user.role,
              });
            }
          } catch (error: any) {
            logger.error("Sign in failed", error);
            setError(error.message);
            throw error;
          } finally {
            setLoading(false);
          }
        },

        signUp: async (email, password, fullName) => {
          const { setLoading, setError } = get();

          try {
            setLoading(true);
            setError(null);

            const supabase = createClient();
            const { error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: fullName,
                },
              },
            });

            if (error) throw error;

            logger.info("User signed up", { email });
          } catch (error: any) {
            logger.error("Sign up failed", error);
            setError(error.message);
            throw error;
          } finally {
            setLoading(false);
          }
        },

        signOut: async () => {
          const { setLoading, setError, setUser } = get();

          try {
            setLoading(true);
            setError(null);

            const supabase = createClient();
            const { error } = await supabase.auth.signOut();

            if (error) throw error;

            setUser(null);
            logger.info("User signed out");
          } catch (error: any) {
            logger.error("Sign out failed", error);
            setError(error.message);
            throw error;
          } finally {
            setLoading(false);
          }
        },

        checkUser: async () => {
          const { setLoading, setError, setUser } = get();

          try {
            setLoading(true);
            setError(null);

            const supabase = createClient();
            const {
              data: { user },
              error,
            } = await supabase.auth.getUser();

            if (error) throw error;

            if (user) {
              // Fetch user profile with role
              const { data: profile, error: profileError } = await supabase
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single();

              if (profileError) throw profileError;

              const authUser: User = {
                id: user.id,
                email: user.email!,
                fullName: profile.full_name,
                avatarUrl: profile.avatar_url,
                role: profile.role || UserRole.VIEWER,
                createdAt: new Date(user.created_at),
                lastLoginAt: new Date(),
              };

              setUser(authUser);
            } else {
              setUser(null);
            }
          } catch (error: any) {
            logger.error("Check user failed", error);
            setUser(null);
          } finally {
            setLoading(false);
          }
        },

        hasPermission: (permission) => {
          const { user } = get();

          if (!user) return false;

          const rolePermissions: Record<UserRole, TeamPermissions> = {
            [UserRole.MASTER]: {
              canViewAllPlatforms: true,
              canManageCampaigns: true,
              canCreateReports: true,
              canInviteMembers: true,
              platformAccess: undefined, // Master has access to all platforms
            },
            [UserRole.TEAM_MATE]: {
              canViewAllPlatforms: true,
              canManageCampaigns: true,
              canCreateReports: true,
              canInviteMembers: true,
              platformAccess: undefined, // Team mate has access to all platforms
            },
            [UserRole.VIEWER]: {
              canViewAllPlatforms: false,
              canManageCampaigns: false,
              canCreateReports: false,
              canInviteMembers: false,
              platformAccess: [], // Viewer has limited platform access
            },
          };

          const permissions = rolePermissions[user.role];

          // Special handling for platformAccess
          if (permission === "platformAccess") {
            return permissions.platformAccess !== undefined;
          }

          return permissions[permission] ?? false;
        },

        canAccessPlatform: (_platformId) => {
          const { user } = get();

          if (!user) return false;

          // Master and Team Mate can access all platforms
          if (user.role !== UserRole.VIEWER) return true;

          // For viewers, check specific platform access
          // TODO: Implement platform-specific access control
          return false;
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user }),
      },
    ),
  ),
);
