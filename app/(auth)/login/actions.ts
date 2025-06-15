"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";
import { ActionState } from "@/types/actions";
import log from "@/utils/logger";

export type { ActionState };

export async function login(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = formData.get("returnUrl") as string;

  // Validation
  if (!email || !email.includes("@")) {
    return {
      errors: {
        email: "유효한 이메일 주소를 입력해주세요.",
      },
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    log.error("Login error:", error);
    return {
      errors: {
        general:
          error.message === "Invalid login credentials"
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  if (!data.session || !data.user) {
    return {
      errors: {
        general: "로그인에 실패했습니다. 다시 시도해주세요.",
      },
    };
  }

  // Ensure session is properly established
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errors: {
        general: "세션 확인에 실패했습니다. 다시 시도해주세요.",
      },
    };
  }

  log.info("Login successful:", { userId: user.id, email: user.email });

  // Revalidate all paths to ensure the navbar updates
  revalidatePath("/", "layout");
  revalidatePath("/dashboard");

  // Redirect to returnUrl if provided and valid, otherwise to dashboard
  if (returnUrl && returnUrl.startsWith("/")) {
    redirect(returnUrl);
  }
  redirect("/dashboard");
}

export async function signup(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const returnUrl = formData.get("returnUrl") as string;
  const inviteToken = formData.get("inviteToken") as string;

  if (!email || !email.includes("@")) {
    return {
      errors: {
        email: "유효한 이메일 주소를 입력해주세요.",
      },
    };
  }

  if (!password || password.length < 6) {
    return {
      errors: {
        password: "비밀번호는 최소 6자 이상이어야 합니다.",
      },
    };
  }

  log.info("Attempting signup for:", { email });

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: inviteToken ? { invitation_token: inviteToken } : undefined,
    },
  });

  if (error) {
    log.error("Signup error:", { error: error.message, code: error.code });
    return {
      errors: {
        general: error.message,
      },
    };
  }

  log.info("Signup response:", { 
    user: data?.user?.email, 
    session: !!data?.session,
    emailConfirmed: data?.user?.email_confirmed_at 
  });

  // Check if user was created
  if (!data?.user) {
    log.error("No user returned from signup");
    return {
      errors: {
        general: "회원가입에 실패했습니다. 다시 시도해주세요.",
      },
    };
  }

  // If signup is successful and user is immediately logged in
  if (data.session) {
    log.info("User signed up and logged in immediately");
    revalidatePath("/", "layout");

    // Redirect to returnUrl if provided and valid, otherwise to dashboard
    if (returnUrl && returnUrl.startsWith("/")) {
      redirect(returnUrl);
    }
    redirect("/dashboard");
  }

  // User created but needs email confirmation
  log.info("User created, email confirmation required");
  return {
    success: true,
    errors: {
      general: "이메일을 확인하여 계정을 인증해주세요.",
    },
  };
}
