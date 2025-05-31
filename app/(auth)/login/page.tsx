"use client";

import { useActionState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useState } from "react";

import { login, signup, type ActionState } from "./actions";

import { title } from "@/components/primitives";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  const initialState: ActionState = { errors: {} };

  const [loginState, loginAction] = useActionState(login, initialState);
  const [signupState, signupAction] = useActionState(signup, initialState);

  const currentState = isSignUp ? signupState : loginState;
  const currentAction = isSignUp ? signupAction : loginAction;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-1 px-6 pt-6">
          <h1 className={title({ size: "sm" })}>
            {isSignUp ? "회원가입" : "로그인"}
          </h1>
          <p className="text-sm text-default-500">
            {isSignUp
              ? "A.ll + Ad 계정을 생성하세요"
              : "A.ll + Ad 계정에 로그인하세요"}
          </p>
        </CardHeader>
        <CardBody className="px-6 py-4">
          <Form action={currentAction} validationErrors={currentState.errors}>
            <div className="flex flex-col gap-4">
              <Input
                isRequired
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
        </CardBody>
      </Card>
    </div>
  );
}
