"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { AuthError } from "@supabase/supabase-js";

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
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validation
  if (!email || !email.includes("@")) {
    return {
      errors: {
        email: "유효한 이메일 주소를 입력해주세요.",
      },
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error instanceof AuthError) {
      return {
        errors: {
          general: error.message,
        },
      };
    }
  }

  return {
    success: true,
    errors: {
      general: "이메일을 확인하여 계정을 인증해주세요.",
    },
  };
}
