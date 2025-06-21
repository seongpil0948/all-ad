import { NextRequest, NextResponse } from "next/server";

import { GoogleAdsScheduler } from "@/services/scheduler/google-ads-scheduler";
import log from "@/utils/logger";

// This endpoint is called by Vercel cron daily at 2 AM
export async function GET(request: NextRequest) {
  // Verify the request is from a trusted source
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    log.info("Starting Google Ads full sync (daily cron)");

    const scheduler = new GoogleAdsScheduler();

    await scheduler.runScheduledSync("FULL");

    return NextResponse.json({
      success: true,
      syncType: "FULL",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error("Google Ads full sync cron job failed:", error as Error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
