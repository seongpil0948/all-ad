"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Form } from "@heroui/form";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";

import { resetPassword, type ForgotPasswordState } from "./actions";
import { useDictionary } from "@/hooks/use-dictionary";

import { ErrorMessage } from "@/components/common/ErrorMessage";

export function ForgotPasswordForm() {
  const { dictionary: dict } = useDictionary();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const initialState: ForgotPasswordState = {
    errors:
      error === "session_expired"
        ? {
            general: dict.auth.forgotPassword.errors.sessionExpired,
          }
        : {},
  };
  const [state, action] = useActionState(resetPassword, initialState);

  return (
    <Form action={action} validationErrors={state.errors}>
      <div className="flex flex-col gap-4">
        <Input
          isRequired
          errorMessage={state.errors?.email}
          isInvalid={!!state.errors?.email}
          label={dict.auth.forgotPassword.email}
          name="email"
          placeholder={dict.auth.forgotPassword.emailPlaceholder}
          startContent={<FaEnvelope className="text-default-400" />}
          type="email"
          variant="bordered"
        />

        {state.errors?.general && (
          <ErrorMessage
            isSuccess={state.success}
            message={state.errors.general}
          />
        )}

        <Button fullWidth color="primary" type="submit">
          {dict.auth.forgotPassword.submit}
        </Button>

        <Link
          as={Link}
          className="flex items-center gap-1 justify-center text-default-500"
          href="/login"
          size="sm"
        >
          <FaArrowLeft size={12} />
          {dict.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    </Form>
  );
}
