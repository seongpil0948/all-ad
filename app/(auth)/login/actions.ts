"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

export type ActionState = {
  errors?: {
    email?: string;
    password?: string;
    general?: string;
  };
  success?: boolean;
};

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      errors: {
        general:
          error.message === "Invalid login credentials"
            ? "이메일 또는 비밀번호가 올바르지 않습니다."
            : "로그인 중 오류가 발생했습니다. 다시 시도해주세요.",
      },
    };
  }

  // Get the user to ensure session is established
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      errors: {
        general: "로그인에 실패했습니다. 다시 시도해주세요.",
      },
    };
  }

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

  const options = {
    email,
    password,
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    data: inviteToken ? { invitation_token: inviteToken } : undefined,
  };

  const { error, data } = await supabase.auth.signUp(options);

  if (error) {
    log.error("Signup error", error);
    if (error instanceof AuthError) {
      return {
        errors: {
          general: error.message,
        },
      };
    }
  }

  // If signup is successful and user is immediately logged in
  if (data?.user && data?.session) {
    revalidatePath("/", "layout");

    // Redirect to returnUrl if provided and valid, otherwise to dashboard
    if (returnUrl && returnUrl.startsWith("/")) {
      redirect(returnUrl);
    }
    redirect("/dashboard");
  }

  return {
    success: true,
    errors: {
      general: "이메일을 확인하여 계정을 인증해주세요.",
    },
  };
}
