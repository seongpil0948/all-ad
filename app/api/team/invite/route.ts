import { NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { getTeamInvitationEmailTemplate } from "@/utils/email-templates";
import { successResponse } from "@/lib/api/response";
import { ApiErrors, handleApiError, validateParams } from "@/lib/api/errors";

/**
 * API endpoint to send team invitation email
 * This is called after creating an invitation in the database
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw ApiErrors.UNAUTHORIZED();
    }

    const body = await request.json();

    validateParams<{
      email: string;
      inviterName: string;
      teamName: string;
      invitationLink: string;
    }>(body, ["email", "inviterName", "teamName", "invitationLink"]);

    const { email, inviterName, teamName, invitationLink } = body;

    log.info("Sending invitation email", { email, teamName });

    // Prepare email content using template
    const emailContent = {
      to: email,
      subject: `${teamName} 팀에 초대되었습니다 - AllAd`,
      html: getTeamInvitationEmailTemplate({
        inviterName,
        teamName,
        invitationLink,
        email,
      }),
    };

    log.info("Email content prepared", emailContent);

    // Call Supabase Edge Function to send email
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      log.error("Supabase configuration missing");

      throw ApiErrors.INTERNAL_ERROR();
    }

    try {
      log.info("Calling Supabase resend function", {
        url: `${supabaseUrl}/functions/v1/resend`,
        hasKey: !!supabaseAnonKey,
      });

      const response = await fetch(`${supabaseUrl}/functions/v1/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(emailContent),
      });

      const result = await response.json();

      if (!response.ok) {
        log.error("Failed to send email via Supabase function", {
          status: response.status,
          statusText: response.statusText,
          result,
        });

        // Don't fail the entire request if email fails
        // The invitation is already created in the database
        log.warn("Email sending failed but invitation was created");
      } else {
        log.info("Email sent successfully", result);
      }
    } catch (emailError) {
      log.error("Error calling email service", {
        error:
          emailError instanceof Error ? emailError.message : String(emailError),
        message: (emailError as Error).message,
        stack: (emailError as Error).stack,
      });
      // Don't fail the entire request if email fails
      // The invitation is already created in the database
      log.warn("Continuing despite email failure - invitation created");
    }

    return successResponse(null, { message: "Invitation sent successfully" });
  } catch (error) {
    return handleApiError(error, "POST /api/team/invite");
  }
}
