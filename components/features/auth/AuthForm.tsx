"use client";

import { useState, useActionState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Divider } from "@heroui/divider";
import { Form } from "@heroui/form";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Checkbox } from "@heroui/checkbox";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody, CardHeader } from "@heroui/card";

import { clientLogin } from "@/app/[lang]/(auth)/login/client-actions";
import { signup } from "@/app/[lang]/(auth)/login/actions";
import { toast } from "@/utils/toast";
import { useDictionary } from "@/hooks/use-dictionary";
import TermsOfServiceContent from "@/app/[lang]/(public)/terms/TermsOfServiceContent";
import RefundPolicyContent from "@/app/[lang]/(public)/refund-policy/RefundPolicyContent";
import CookiePolicyContent from "@/app/[lang]/(public)/cookies/CookiePolicyContent";
import { ActionState } from "@/types/actions";

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
  const AC_EMAIL = "email" as const;
  const AC_NEW_PASSWORD = "new-password" as const;
  const AC_CURRENT_PASSWORD = "current-password" as const;
  const TID = {
    signupEmail: "signup-input-email",
    signupPassword: "signup-input-password",
    signupSubmit: "signup-submit",
    loginForm: "login-form",
    loginId: "login-input-id",
    loginPw: "login-input-pw",
    loginSubmit: "login-submit",
  } as const;
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const router = useRouter();
  const { dictionary: dict } = useDictionary();

  // For signup, we use server action with useActionState
  const initialState: ActionState = { errors: {} };
  const [signupState, signupAction, isSignupPending] = useActionState(
    signup,
    initialState,
  );

  // Handle login with client action
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await clientLogin(email, password, returnUrl, router);

      if (!result.success && result.error) {
        toast.error({
          title: dict.auth.login.errors.general,
          description: result.error,
        });
      }
    } catch {
      toast.error({
        title: dict.common.error,
        description: dict.errors.general,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const termsContent = (
    <div className="flex w-full flex-col">
      <Tabs>
        <Tab key="terms" title={dict.footer.terms}>
          <Card>
            <CardBody className="max-h-64 overflow-y-auto">
              <TermsOfServiceContent />
            </CardBody>
          </Card>
        </Tab>
        <Tab key="refund" title={dict.footer.refund}>
          <Card>
            <CardBody className="max-h-64 overflow-y-auto">
              <RefundPolicyContent />
            </CardBody>
          </Card>
        </Tab>
        <Tab key="cookies" title={dict.footer.cookies}>
          <Card>
            <CardBody className="max-h-64 overflow-y-auto">
              <CookiePolicyContent />
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col gap-1 px-6 pt-6 text-center">
        <h1 className="text-2xl font-bold">
          {isSignUp ? dict.auth.signup.title : dict.auth.login.title}
        </h1>
        {isSignUp && (
          <p className="text-sm text-default-500">
            {dict.home.cta.sectionSubtitle}
          </p>
        )}
      </CardHeader>
      <CardBody className="px-6 py-4">
        {isSignUp ? (
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
                autoComplete={AC_EMAIL}
                data-test-id={TID.signupEmail}
                defaultValue={defaultEmail}
                errorMessage={signupState.errors?.email}
                isInvalid={!!signupState.errors?.email}
                label={dict.auth.signup.email}
                name="email"
                placeholder={dict.auth.signup.emailPlaceholder}
                startContent={<FaEnvelope className="text-default-400" />}
                type="email"
                variant="bordered"
              />
              <Input
                isRequired
                autoComplete={AC_NEW_PASSWORD}
                data-test-id={TID.signupPassword}
                errorMessage={signupState.errors?.password}
                isInvalid={!!signupState.errors?.password}
                label={dict.auth.signup.password}
                name="password"
                placeholder={dict.auth.signup.passwordPlaceholder}
                startContent={<FaLock className="text-default-400" />}
                type="password"
                variant="bordered"
              />

              <Accordion>
                <AccordionItem
                  key="terms"
                  aria-label={dict.footer.terms}
                  title={dict.footer.legal}
                >
                  {termsContent}
                </AccordionItem>
              </Accordion>

              <Checkbox
                isSelected={isTermsAgreed}
                onValueChange={setIsTermsAgreed}
              >
                <span className="text-sm">
                  {dict.consent.required} {dict.auth.signup.agreeToTerms}{" "}
                  <Link href="/terms">{dict.footer.terms}</Link>,{" "}
                  <Link href="/refund-policy">{dict.footer.refund}</Link>,{" "}
                  <Link href="/cookies">{dict.footer.cookies}</Link>
                </span>
              </Checkbox>

              {signupState.errors?.general && (
                <div
                  className={`text-sm ${
                    signupState.success ? "text-success" : "text-danger"
                  }`}
                >
                  {signupState.errors.general}
                </div>
              )}

              <Button
                fullWidth
                color="primary"
                data-test-id={TID.signupSubmit}
                isDisabled={!isTermsAgreed || isSignupPending}
                isLoading={isSignupPending}
                type="submit"
              >
                {dict.auth.signup.submit}
              </Button>
            </div>
          </Form>
        ) : (
          <form data-test-id={TID.loginForm} onSubmit={handleLogin}>
            <div className="flex flex-col gap-4 items-center w-full min-w-sm mx-auto">
              <Input
                isRequired
                autoComplete={AC_EMAIL}
                data-test-id={TID.loginId}
                defaultValue={defaultEmail}
                isDisabled={isLoading}
                label={dict.auth.login.email}
                name="email"
                placeholder={dict.auth.login.emailPlaceholder}
                startContent={<FaEnvelope className="text-default-400" />}
                type="email"
                variant="bordered"
              />
              <Input
                isRequired
                autoComplete={AC_CURRENT_PASSWORD}
                data-test-id={TID.loginPw}
                isDisabled={isLoading}
                label={dict.auth.login.password}
                name="password"
                placeholder={dict.auth.login.passwordPlaceholder}
                startContent={<FaLock className="text-default-400" />}
                type="password"
                variant="bordered"
              />

              <Button
                fullWidth
                color="primary"
                data-test-id={TID.loginSubmit}
                isDisabled={isLoading}
                isLoading={isLoading}
                type="submit"
              >
                {dict.auth.login.submit}
              </Button>
            </div>
          </form>
        )}

        <Divider className="my-4" />

        <div className="text-center">
          <p className="text-sm text-default-500">
            {isSignUp ? dict.auth.signup.hasAccount : dict.auth.login.noAccount}{" "}
            <Link
              className="cursor-pointer"
              size="sm"
              onPress={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? dict.auth.signup.login : dict.auth.login.signUp}
            </Link>
          </p>
        </div>

        {!isSignUp && (
          <div className="text-center mt-2">
            <Link href="/forgot-password" size="sm">
              {dict.auth.login.forgotPassword}
            </Link>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
