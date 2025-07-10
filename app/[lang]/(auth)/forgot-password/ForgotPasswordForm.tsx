"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Form } from "@heroui/form";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";

import { resetPassword, type ForgotPasswordState } from "./actions";

import { ErrorMessage } from "@/components/common/ErrorMessage";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const initialState: ForgotPasswordState = {
    errors:
      error === "session_expired"
        ? {
            general:
              "세션이 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.",
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
          label="이메일"
          name="email"
          placeholder="your@email.com"
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
          재설정 링크 보내기
        </Button>

        <Link
          as={Link}
          className="flex items-center gap-1 justify-center text-default-500"
          href="/login"
          size="sm"
        >
          <FaArrowLeft size={12} />
          로그인으로 돌아가기
        </Link>
      </div>
    </Form>
  );
}
