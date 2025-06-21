"use server";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";

export interface ResetPasswordState {
  errors?: {
    password?: string;
    confirmPassword?: string;
    general?: string;
  };
  success?: boolean;
}

export async function updatePassword(
  prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  // token은 이미 Supabase 세션에서 처리됨

  // Validation
  if (!password || password.length < 6) {
    return {
      errors: {
        password: "비밀번호는 최소 6자 이상이어야 합니다.",
      },
    };
  }

  if (password !== confirmPassword) {
    return {
      errors: {
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      },
    };
  }

  // Update password using the current session
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    log.error("Password update error:", error);

    return {
      errors: {
        general: "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    success: true,
    errors: {
      general:
        "비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.",
    },
  };
}
