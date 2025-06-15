"use client";

import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import log from "@/utils/logger";

export interface ClientLoginResult {
  success: boolean;
  error?: string;
}

export async function clientLogin(
  email: string,
  password: string,
  returnUrl?: string,
  router?: any, // Router passed from component
): Promise<ClientLoginResult> {
  const supabase = createClient();
  const setUser = useAuthStore.getState().setUser;
  const setIsInitialized = useAuthStore.getState().setIsInitialized;

  try {
    // Validate input
    if (!email || !email.includes("@")) {
      return {
        success: false,
        error: "유효한 이메일 주소를 입력해주세요.",
      };
    }

    if (!password) {
      return {
        success: false,
        error: "비밀번호를 입력해주세요.",
      };
    }

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      log.error("Client login error:", error);
      return {
        success: false,
        error:
          error.message === "Invalid login credentials"
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
      };
    }

    if (!data.session || !data.user) {
      return {
        success: false,
        error: "로그인에 실패했습니다. 다시 시도해주세요.",
      };
    }

    // Update auth store with user data
    setUser(data.user);
    setIsInitialized(true);

    log.info("Client login successful:", {
      userId: data.user.id,
      email: data.user.email,
    });

    // Handle redirection if router is provided
    if (router) {
      const targetUrl =
        returnUrl && returnUrl.startsWith("/") ? returnUrl : "/dashboard";

      // Use router.push for client-side navigation
      router.push(targetUrl);

      // Also trigger a hard refresh to ensure all server components update
      router.refresh();
    }

    return {
      success: true,
    };
  } catch (error) {
    log.error("Unexpected client login error:", error);
    return {
      success: false,
      error: "예기치 않은 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }
}

export async function clientSignup(
  email: string,
  password: string,
  inviteToken?: string,
  router?: any,
): Promise<ClientLoginResult> {
  const supabase = createClient();
  const setUser = useAuthStore.getState().setUser;
  const setIsInitialized = useAuthStore.getState().setIsInitialized;

  try {
    // Validate input
    if (!email || !email.includes("@")) {
      return {
        success: false,
        error: "유효한 이메일 주소를 입력해주세요.",
      };
    }

    if (!password || password.length < 6) {
      return {
        success: false,
        error: "비밀번호는 최소 6자 이상이어야 합니다.",
      };
    }

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`,
        data: inviteToken ? { invitation_token: inviteToken } : undefined,
      },
    });

    if (error) {
      log.error("Client signup error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // If signup is successful and user is immediately logged in
    if (data?.user && data?.session) {
      setUser(data.user);
      setIsInitialized(true);

      log.info("Client signup successful with immediate login:", {
        userId: data.user.id,
        email: data.user.email,
      });

      if (router) {
        router.push("/dashboard");
        router.refresh();
      }

      return {
        success: true,
      };
    }

    // If email confirmation is required
    return {
      success: true,
      error: "이메일을 확인하여 계정을 인증해주세요.",
    };
  } catch (error) {
    log.error("Unexpected client signup error:", error);
    return {
      success: false,
      error: "예기치 않은 오류가 발생했습니다. 다시 시도해주세요.",
    };
  }
}

export async function clientLogout(router?: any): Promise<void> {
  const supabase = createClient();
  const setUser = useAuthStore.getState().setUser;
  const setIsInitialized = useAuthStore.getState().setIsInitialized;

  try {
    await supabase.auth.signOut();

    // Clear auth store
    setUser(null);
    setIsInitialized(true);

    log.info("Client logout successful");

    // Redirect to home page if router provided
    if (router) {
      router.push("/");
      router.refresh();
    }
  } catch (error) {
    log.error("Client logout error:", error);
    // Even if logout fails, clear local state
    setUser(null);
    setIsInitialized(true);
    if (router) {
      router.push("/");
      router.refresh();
    }
  }
}
