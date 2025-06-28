"use client";

import { useActionState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { FaLock } from "react-icons/fa";

import { updatePassword, type ResetPasswordState } from "./actions";

import log from "@/utils/logger";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const initialState: ResetPasswordState = { errors: {} };
  const [state, action] = useActionState(updatePassword, initialState);

  useEffect(() => {
    if (!token) {
      log.error("No reset token found in URL");
      router.push("/forgot-password");
    }
  }, [token, router]);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [state.success, router]);

  return (
    <Form action={action} validationErrors={state.errors}>
      <input name="token" type="hidden" value={token || ""} />

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
          <div
            className={`text-sm ${state.success ? "text-success" : "text-danger"}`}
          >
            {state.errors.general}
          </div>
        )}

        <Button fullWidth color="primary" type="submit">
          비밀번호 변경
        </Button>
      </div>
    </Form>
  );
}
