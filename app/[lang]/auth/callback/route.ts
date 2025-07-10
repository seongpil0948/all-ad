import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { ensureUserHasTeam } from "@/lib/data/teams";
import log from "@/utils/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle auth errors first
  if (error) {
    log.error("Auth callback error", { error, errorDescription });

    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?error=${error}`,
    );
  }

  if (code) {
    const supabase = await createClient();

    try {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        log.error("Code exchange error", { error: exchangeError });

        return NextResponse.redirect(
          `${origin}/auth/auth-code-error?error=code_exchange_failed`,
        );
      }

      // After successful auth, ensure user has a team
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        try {
          const teamResult = await ensureUserHasTeam(user.id);

          log.info("Team ensured for user after auth callback", {
            userId: user.id,
            teamResult,
          });
        } catch (teamError) {
          log.error("Failed to ensure team for user", {
            userId: user.id,
            error: teamError,
          });
          // Don't fail the auth flow for team creation issues
        }
      }

      // Determine redirect URL
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      let redirectUrl: string;

      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }

      log.info("Auth callback success, redirecting", {
        userId: user?.id,
        next,
        redirectUrl,
        isPasswordReset: next === "/reset-password",
      });

      return NextResponse.redirect(redirectUrl);
    } catch (err) {
      log.error("Unexpected error in auth callback", { error: err });

      return NextResponse.redirect(
        `${origin}/auth/auth-code-error?error=unexpected_error`,
      );
    }
  }

  // No code provided
  log.warn("Auth callback called without code parameter");

  return NextResponse.redirect(
    `${origin}/auth/auth-code-error?error=missing_code`,
  );
}
