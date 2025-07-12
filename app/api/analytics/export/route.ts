import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { getUserPrimaryTeamId } from "@/utils/team/user-teams";
import { getAnalyticsData } from "@/lib/data/analytics";
import { handleApiError } from "@/lib/api/errors";
import log from "@/utils/logger";

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { format = "csv", dateRange } = body;

    if (!dateRange || !dateRange.start || !dateRange.end) {
      return NextResponse.json(
        { error: "Date range is required for export" },
        { status: 400 },
      );
    }

    const parsedDateRange = {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
    };

    // Validate date range
    if (
      isNaN(parsedDateRange.start.getTime()) ||
      isNaN(parsedDateRange.end.getTime())
    ) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 },
      );
    }

    // Get analytics data for export
    const analyticsData = await getAnalyticsData(teamId, parsedDateRange);

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = [
        "Date",
        "Platform",
        "Impressions",
        "Clicks",
        "Cost",
        "Conversions",
        "Revenue",
        "CTR (%)",
        "CPC",
        "ROAS",
      ];

      const csvRows = analyticsData.map((row) => {
        const ctr =
          row.impressions > 0
            ? ((row.clicks / row.impressions) * 100).toFixed(2)
            : "0";
        const cpc = row.clicks > 0 ? (row.cost / row.clicks).toFixed(2) : "0";
        const roas = row.cost > 0 ? (row.revenue / row.cost).toFixed(2) : "0";

        return [
          row.date,
          row.platform,
          row.impressions,
          row.clicks,
          row.cost.toFixed(2),
          row.conversions,
          row.revenue.toFixed(2),
          ctr,
          cpc,
          roas,
        ].join(",");
      });

      const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");

      log.info("Analytics data exported as CSV", {
        userId: user.id,
        teamId,
        dateRange: parsedDateRange,
        recordCount: analyticsData.length,
      });

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics-${teamId}-${parsedDateRange.start.toISOString().split("T")[0]}-to-${parsedDateRange.end.toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // For other formats (JSON by default)
    log.info("Analytics data exported as JSON", {
      userId: user.id,
      teamId,
      dateRange: parsedDateRange,
      recordCount: analyticsData.length,
    });

    return NextResponse.json({
      success: true,
      format,
      data: analyticsData,
      meta: {
        dateRange: parsedDateRange,
        recordCount: analyticsData.length,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error, "POST /api/analytics/export");
  }
}
