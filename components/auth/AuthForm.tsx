"use client";

import { useActionState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useState } from "react";

import { login, signup, type ActionState } from "@/app/(auth)/login/actions";

interface AuthFormProps {
  initialMode?: "login" | "signup";
  returnUrl?: string;
  defaultEmail?: string;
  inviteToken?: string;
}

export function AuthForm({
  initialMode = "login",
  returnUrl,
  defaultEmail,
  inviteToken,
}: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const initialState: ActionState = { errors: {} };

  const [loginState, loginAction] = useActionState(login, initialState);
  const [signupState, signupAction] = useActionState(signup, initialState);

  const currentState = isSignUp ? signupState : loginState;
  const currentAction = isSignUp ? signupAction : loginAction;

  return (
    <>
      <Form action={currentAction} validationErrors={currentState.errors}>
        {returnUrl && (
          <input name="returnUrl" type="hidden" value={returnUrl} />
        )}
        {inviteToken && (
          <input name="inviteToken" type="hidden" value={inviteToken} />
        )}
        <div className="flex flex-col gap-4 items-center w-full min-w-sm mx-auto">
          <Input
            isRequired
            defaultValue={defaultEmail}
            errorMessage={currentState.errors?.email}
            isInvalid={!!currentState.errors?.email}
            label="이메일"
            name="email"
            placeholder="your@email.com"
            startContent={<FaEnvelope className="text-default-400" />}
            type="email"
            variant="bordered"
          />
          <Input
            isRequired
            errorMessage={currentState.errors?.password}
            isInvalid={!!currentState.errors?.password}
            label="비밀번호"
            name="password"
            placeholder="비밀번호를 입력하세요"
            startContent={<FaLock className="text-default-400" />}
            type="password"
            variant="bordered"
          />

          {currentState.errors?.general && (
            <div
              className={`text-sm ${signupState.success ? "text-success" : "text-danger"}`}
            >
              {currentState.errors.general}
            </div>
          )}

          <Button fullWidth color="primary" type="submit">
            {isSignUp ? "회원가입" : "로그인"}
          </Button>
        </div>
      </Form>

      <Divider className="my-4" />

      <div className="text-center">
        <p className="text-sm text-default-500">
          {isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}{" "}
          <Link
            className="cursor-pointer"
            size="sm"
            onPress={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "로그인" : "회원가입"}
          </Link>
        </p>
      </div>

      {!isSignUp && (
        <div className="text-center mt-2">
          <Link href="/forgot-password" size="sm">
            비밀번호를 잊으셨나요?
          </Link>
        </div>
      )}
    </>
  );
}
