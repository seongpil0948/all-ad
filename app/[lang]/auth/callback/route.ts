import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { ensureUserHasTeam } from "@/lib/data/teams";
import log from "@/utils/logger";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
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

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
