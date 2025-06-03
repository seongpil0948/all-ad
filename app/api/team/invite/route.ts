import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import log from "@/utils/logger";
import { getTeamInvitationEmailTemplate } from "@/utils/email-templates";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, inviterName, teamName, invitationLink } =
      await request.json();

    if (!email || !inviterName || !teamName || !invitationLink) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

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

      return NextResponse.json(
        { error: "Email service configuration error" },
        { status: 500 },
      );
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
        error: emailError,
        message: (emailError as Error).message,
        stack: (emailError as Error).stack,
      });
      // Don't fail the entire request if email fails
      // The invitation is already created in the database
      log.warn("Continuing despite email failure - invitation created");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error("Failed to send invitation email", error as Error);

    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 },
    );
  }
}
