import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { getUserPrimaryTeamId } from "@/utils/team/user-teams";
import {
  getAnalyticsSummary,
  getPlatformAnalytics,
  getTimeSeriesData,
} from "@/lib/data/analytics";
import { handleApiError } from "@/lib/api/errors";
import log from "@/utils/logger";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's team
    const teamId = await getUserPrimaryTeamId(user.id);

    if (!teamId) {
      return NextResponse.json({ error: "No team found" }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Start and end dates are required" },
        { status: 400 },
      );
    }

    const dateRange = {
      start: new Date(start),
      end: new Date(end),
    };

    // Validate date range
    if (isNaN(dateRange.start.getTime()) || isNaN(dateRange.end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Fetch analytics data in parallel
    const [summary, platformData, timeSeriesData] = await Promise.all([
      getAnalyticsSummary(teamId, dateRange),
      getPlatformAnalytics(teamId, dateRange),
      Promise.all([
        getTimeSeriesData(teamId, dateRange, "impressions"),
        getTimeSeriesData(teamId, dateRange, "clicks"),
        getTimeSeriesData(teamId, dateRange, "cost"),
        getTimeSeriesData(teamId, dateRange, "conversions"),
        getTimeSeriesData(teamId, dateRange, "revenue"),
      ]).then(([impressions, clicks, cost, conversions, revenue]) => ({
        impressions,
        clicks,
        cost,
        conversions,
        revenue,
      })),
    ]);

    log.info("Analytics data fetched successfully", {
      userId: user.id,
      teamId,
      dateRange: { start, end },
      summaryMetrics: {
        totalImpressions: summary.totalImpressions,
        totalClicks: summary.totalClicks,
        totalCost: summary.totalCost,
      },
      platformCount: platformData.length,
    });

    return NextResponse.json({
      success: true,
      summary,
      platformData,
      timeSeriesData,
      meta: {
        dateRange: { start, end },
        teamId,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/analytics");
  }
}
