"use server";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { ResetPasswordState } from "@/types/auth.types";

export type { ResetPasswordState };

export async function updatePassword(
  prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

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

  try {
    // Check if user has a valid session for password reset
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      log.error("No valid user for password reset:", userError);

      return {
        errors: {
          general:
            "세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.",
        },
      };
    }

    // Update password using the current session
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      log.error("Password update error:", error);

      if (error.message.includes("session_not_found")) {
        return {
          errors: {
            general:
              "세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.",
          },
        };
      }

      return {
        errors: {
          general: "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
        },
      };
    }

    log.info("Password updated successfully", { userId: user.id });

    // Don't redirect here, let the component handle it
    return {
      success: true,
      errors: {
        general:
          "비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.",
      },
    };
  } catch (err) {
    log.error("Unexpected error during password update:", err);

    return {
      errors: {
        general: "시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
    };
  }
}
