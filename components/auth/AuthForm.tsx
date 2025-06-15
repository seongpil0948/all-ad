"use client";

import { useState, useActionState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";

import { clientLogin } from "@/app/(auth)/login/client-actions";
import { signup, type ActionState } from "@/app/(auth)/login/actions";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // For signup, we use server action with useActionState
  const initialState: ActionState = { errors: {} };
  const [signupState, signupAction, isSignupPending] = useActionState(signup, initialState);

  // Handle login with client action
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await clientLogin(email, password, returnUrl, router);

      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("예기치 않은 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isSignUp ? (
        // Signup form using server action
        <Form action={signupAction} validationErrors={signupState.errors}>
          {returnUrl && (
            <input name="returnUrl" type="hidden" value={returnUrl} />
          )}
          {inviteToken && (
            <input name="inviteToken" type="hidden" value={inviteToken} />
          )}
          <div className="flex flex-col gap-4 items-center w-full min-w-sm mx-auto">
            <Input
              isRequired
              autoComplete="email"
              defaultValue={defaultEmail}
              errorMessage={signupState.errors?.email}
              isInvalid={!!signupState.errors?.email}
              label="이메일"
              name="email"
              placeholder="your@email.com"
              startContent={<FaEnvelope className="text-default-400" />}
              type="email"
              variant="bordered"
            />
            <Input
              isRequired
              autoComplete="new-password"
              errorMessage={signupState.errors?.password}
              isInvalid={!!signupState.errors?.password}
              label="비밀번호"
              name="password"
              placeholder="비밀번호를 입력하세요"
              startContent={<FaLock className="text-default-400" />}
              type="password"
              variant="bordered"
            />

            {signupState.errors?.general && (
              <div className={`text-sm ${signupState.success ? "text-success" : "text-danger"}`}>
                {signupState.errors.general}
              </div>
            )}

            <Button color="primary" fullWidth type="submit" isLoading={isSignupPending}>
              회원가입
            </Button>
          </div>
        </Form>
      ) : (
        // Login form using client action
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-4 items-center w-full min-w-sm mx-auto">
            <Input
              isRequired
              autoComplete="email"
              defaultValue={defaultEmail}
              isDisabled={isLoading}
              label="이메일"
              name="email"
              placeholder="your@email.com"
              startContent={<FaEnvelope className="text-default-400" />}
              type="email"
              variant="bordered"
            />
            <Input
              isRequired
              autoComplete="current-password"
              isDisabled={isLoading}
              label="비밀번호"
              name="password"
              placeholder="비밀번호를 입력하세요"
              startContent={<FaLock className="text-default-400" />}
              type="password"
              variant="bordered"
            />

            {error && <div className="text-sm text-danger">{error}</div>}

            <Button
              color="primary"
              fullWidth
              isDisabled={isLoading}
              isLoading={isLoading}
              type="submit"
            >
              로그인
            </Button>
          </div>
        </form>
      )}

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