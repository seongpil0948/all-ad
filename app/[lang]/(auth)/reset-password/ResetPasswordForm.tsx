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
import { useDictionary } from "@/hooks/use-dictionary";

export function ResetPasswordForm() {
  const { dictionary: dict } = useDictionary();
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
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          log.error("Error checking user:", error);
          setIsValidSession(false);
          setSessionChecked(true);

          return;
        }

        if (!user) {
          log.warn("No active user found for password reset");
          setIsValidSession(false);
          setSessionChecked(true);

          return;
        }

        // Valid user found for password recovery
        log.info("Valid user found for password reset", { userId: user.id });
        setIsValidSession(true);
        setSessionChecked(true);
      } catch (err) {
        log.error("Unexpected error checking user:", err);
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
          <p className="text-sm text-default-500">
            {dict.auth.resetPassword.checkingSession}
          </p>
        </div>
      </div>
    );
  }

  // Show error if session is invalid
  if (!isValidSession) {
    return (
      <div className="text-center">
        <p className="text-danger text-sm">
          {dict.auth.resetPassword.invalidSession}
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
          label={dict.auth.resetPassword.newPassword}
          name="password"
          placeholder={dict.auth.resetPassword.newPasswordPlaceholder}
          startContent={<FaLock className="text-default-400" />}
          type="password"
          variant="bordered"
        />

        <Input
          isRequired
          errorMessage={state.errors?.confirmPassword}
          isInvalid={!!state.errors?.confirmPassword}
          label={dict.auth.resetPassword.confirmPassword}
          name="confirmPassword"
          placeholder={dict.auth.resetPassword.confirmPasswordPlaceholder}
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
          {dict.auth.resetPassword.submit}
        </Button>
      </div>
    </Form>
  );
}
