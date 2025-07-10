"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { FaLock } from "react-icons/fa";

import { updatePassword, type ResetPasswordState } from "./actions";

import { createClient } from "@/utils/supabase/client";
import log from "@/utils/logger";
import { ErrorMessage } from "@/components/common/ErrorMessage";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const initialState: ResetPasswordState = { errors: {} };
  const [state, action] = useActionState(updatePassword, initialState);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          log.error("Error checking session:", error);
          setIsValidSession(false);
          setSessionChecked(true);

          return;
        }

        if (!session) {
          log.warn("No active session found for password reset");
          setIsValidSession(false);
          setSessionChecked(true);

          return;
        }

        // Check if this is a password recovery session
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          log.warn("No user found in session");
          setIsValidSession(false);
          setSessionChecked(true);

          return;
        }

        log.info("Valid session found for password reset", { userId: user.id });
        setIsValidSession(true);
        setSessionChecked(true);
      } catch (err) {
        log.error("Unexpected error checking session:", err);
        setIsValidSession(false);
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (sessionChecked && !isValidSession) {
      log.warn("Invalid session, redirecting to forgot password");
      router.push("/forgot-password?error=session_expired");
    }
  }, [sessionChecked, isValidSession, router]);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [state.success, router]);

  // Show loading while checking session
  if (!sessionChecked) {
    return (
      <div className="flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-default-500">세션을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // Show error if session is invalid
  if (!isValidSession) {
    return (
      <div className="text-center">
        <p className="text-danger text-sm">
          유효하지 않은 세션입니다. 비밀번호 재설정을 다시 요청해주세요.
        </p>
      </div>
    );
  }

  return (
    <Form action={action} validationErrors={state.errors}>
      <div className="flex flex-col gap-4">
        <Input
          isRequired
          errorMessage={state.errors?.password}
          isInvalid={!!state.errors?.password}
          label="새 비밀번호"
          name="password"
          placeholder="최소 6자 이상"
          startContent={<FaLock className="text-default-400" />}
          type="password"
          variant="bordered"
        />

        <Input
          isRequired
          errorMessage={state.errors?.confirmPassword}
          isInvalid={!!state.errors?.confirmPassword}
          label="비밀번호 확인"
          name="confirmPassword"
          placeholder="비밀번호를 다시 입력하세요"
          startContent={<FaLock className="text-default-400" />}
          type="password"
          variant="bordered"
        />

        {state.errors?.general && (
          <ErrorMessage
            isSuccess={state.success}
            message={state.errors.general}
          />
        )}

        <Button fullWidth color="primary" type="submit">
          비밀번호 변경
        </Button>
      </div>
    </Form>
  );
}
