"use server";

import { createClient } from "@/utils/supabase/server";

export type ForgotPasswordState = {
  errors?: {
    email?: string;
    general?: string;
  };
  success?: boolean;
};

export async function resetPassword(
  prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email || !email.includes("@")) {
    return {
      errors: {
        email: "유효한 이메일 주소를 입력해주세요.",
      },
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      errors: {
        general:
          "비밀번호 재설정 이메일 전송에 실패했습니다. 다시 시도해주세요.",
      },
    };
  }

  return {
    success: true,
    errors: {
      general: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
    },
  };
}
