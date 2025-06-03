import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import logger from "@/utils/logger";

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

    logger.info("Sending invitation email", { email, teamName });

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, we'll just log the email content
    const emailContent = {
      to: email,
      subject: `You've been invited to join ${teamName} on AllAd`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Team Invitation</h2>
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${teamName}</strong> on AllAd.</p>
          <p>AllAd helps teams manage their advertising campaigns across multiple platforms in one place.</p>
          <p>Click the link below to accept the invitation:</p>
          <div style="margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #6b7280; word-break: break-all;">${invitationLink}</p>
          <p>This invitation will expire in 7 days.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    logger.info("Email content prepared", emailContent);

    // In production, send actual email here
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send(emailContent);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to send invitation email", error);

    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 },
    );
  }
}
