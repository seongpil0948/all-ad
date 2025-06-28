import { test, expect, AnnotationType } from "../tester";

test.describe("Google Ads Reporting & Analytics", () => {
  test.use({ storageState: "tests/asset/storageState.json" });

  test.beforeEach(async ({ page, pushAnnotation, context }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Google Ads Integration");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Reporting & Analytics");

    // Mock connected Google Ads account
    await context.route("**/platform_credentials*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "google-cred-1",
                platform: "google",
                is_active: true,
                account_name: "Google Ads - 7982378016",
                account_id: "7982378016",
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("should display Google Ads performance dashboard", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Performance Dashboard");

    // Mock dashboard data
    await context.route("**/analytics/google-ads/dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            totalSpend: 2500000,
            totalImpressions: 1250000,
            totalClicks: 35000,
            totalConversions: 2500,
            avgCtr: 2.8,
            avgCpc: 71.43,
            avgCpa: 1000,
            roas: 4.5,
          },
          campaigns: 15,
          activeAccounts: 1,
          lastUpdated: new Date().toISOString(),
        }),
      });
    });

    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Check Google Ads metrics card
    const googleAdsCard = page.locator('[data-testid="platform-card-google"]');
    await expect(googleAdsCard).toBeVisible();

    // Verify key metrics
    await expect(googleAdsCard.getByText("₩2,500,000")).toBeVisible(); // Total spend
    await expect(googleAdsCard.getByText("1,250,000")).toBeVisible(); // Impressions
    await expect(googleAdsCard.getByText("2.8%")).toBeVisible(); // CTR
    await expect(googleAdsCard.getByText("ROAS: 4.5")).toBeVisible();
  });

  test("should show Google Ads campaign performance chart", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Performance Charts");

    // Mock chart data
    await context.route("**/analytics/google-ads/charts*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          daily: [
            {
              date: "2025-06-21",
              impressions: 150000,
              clicks: 4200,
              cost: 300000,
              conversions: 300,
            },
            {
              date: "2025-06-22",
              impressions: 165000,
              clicks: 4800,
              cost: 340000,
              conversions: 350,
            },
            {
              date: "2025-06-23",
              impressions: 180000,
              clicks: 5100,
              cost: 380000,
              conversions: 380,
            },
            {
              date: "2025-06-24",
              impressions: 175000,
              clicks: 4900,
              cost: 360000,
              conversions: 360,
            },
            {
              date: "2025-06-25",
              impressions: 190000,
              clicks: 5500,
              cost: 400000,
              conversions: 410,
            },
            {
              date: "2025-06-26",
              impressions: 195000,
              clicks: 5800,
              cost: 420000,
              conversions: 430,
            },
            {
              date: "2025-06-27",
              impressions: 195000,
              clicks: 5700,
              cost: 300000,
              conversions: 270,
            },
          ],
        }),
      });
    });

    await page.goto("/dashboard");

    // Navigate to analytics/charts section
    // Navigate to analytics tab
    await page
      .locator('button:has-text("분석"), button:has-text("Analytics")')
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Check chart container
    const chartContainer = page.locator(
      '[data-testid="google-ads-performance-chart"]',
    );
    await expect(chartContainer).toBeVisible();

    // Verify chart controls
    await expect(
      page.getByRole("button", { name: /일간|Daily/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /주간|Weekly/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /월간|Monthly/i }),
    ).toBeVisible();
  });

  test("should generate Google Ads performance report", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Report Generation");

    // Mock report generation
    await context.route("**/reports/google-ads/generate", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reportId: "report-123",
          status: "processing",
        }),
      });
    });

    await context.route("**/reports/report-123/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "completed",
          downloadUrl: "/reports/report-123/download",
        }),
      });
    });

    await page.goto("/integrated");
    // Navigate to reports tab
    await page
      .locator('button:has-text("보고서"), button:has-text("Reports")')
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Click generate report
    await page
      .getByRole("button", { name: /보고서 생성|Generate Report/i })
      .click();

    // Select Google Ads
    await page.getByLabel("플랫폼").click();
    await page.getByRole("option", { name: "Google Ads" }).click();

    // Select date range
    await page.getByLabel("기간").click();
    await page.getByRole("option", { name: "지난 30일" }).click();

    // Generate
    await page.getByRole("button", { name: "생성" }).click();

    // Should show processing status
    await expect(page.getByText(/보고서.*생성 중/i)).toBeVisible();

    // Should complete and show download
    await expect(
      page.getByRole("button", { name: /다운로드|Download/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("should compare Google Ads performance with other platforms", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Platform Comparison");

    // Mock comparison data
    await context.route("**/analytics/platform-comparison*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          platforms: [
            {
              platform: "google",
              name: "Google Ads",
              metrics: {
                spend: 2500000,
                impressions: 1250000,
                clicks: 35000,
                ctr: 2.8,
                cpc: 71.43,
                conversions: 2500,
                cpa: 1000,
              },
            },
            {
              platform: "meta",
              name: "Meta Ads",
              metrics: {
                spend: 1800000,
                impressions: 2500000,
                clicks: 50000,
                ctr: 2.0,
                cpc: 36,
                conversions: 3000,
                cpa: 600,
              },
            },
          ],
        }),
      });
    });

    await page.goto("/dashboard");
    // Navigate to compare tab
    await page
      .locator('button:has-text("비교"), button:has-text("Compare")')
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Should show comparison table
    const comparisonTable = page.locator(
      '[data-testid="platform-comparison-table"]',
    );
    await expect(comparisonTable).toBeVisible();

    // Verify Google Ads metrics in comparison
    const googleRow = comparisonTable
      .locator("tr")
      .filter({ hasText: "Google Ads" });
    await expect(googleRow.getByText("₩2,500,000")).toBeVisible();
    await expect(googleRow.getByText("2.8%")).toBeVisible();
    await expect(googleRow.getByText("₩1,000")).toBeVisible();
  });

  test("should show Google Ads keyword performance", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Keyword Performance");

    // Mock keyword data
    await context.route("**/google-ads/keywords*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          keywords: [
            {
              id: "kw_1",
              text: "온라인 마케팅",
              campaignName: "Brand Campaign",
              impressions: 50000,
              clicks: 2500,
              cost: 125000,
              conversions: 150,
              ctr: 5.0,
              cpc: 50,
              qualityScore: 9,
            },
            {
              id: "kw_2",
              text: "디지털 광고",
              campaignName: "Generic Campaign",
              impressions: 35000,
              clicks: 1200,
              cost: 84000,
              conversions: 80,
              ctr: 3.43,
              cpc: 70,
              qualityScore: 7,
            },
          ],
        }),
      });
    });

    await page.goto("/integrated");
    // Navigate to keywords tab
    await page
      .locator('button:has-text("키워드"), button:has-text("Keywords")')
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Filter by Google Ads
    await page.getByRole("combobox", { name: /플랫폼/i }).click();
    await page.getByRole("option", { name: "Google Ads" }).click();

    // Should show keyword performance table
    await expect(page.getByText("온라인 마케팅")).toBeVisible();
    await expect(page.getByText("디지털 광고")).toBeVisible();

    // Check quality scores
    await expect(page.getByText("9/10")).toBeVisible();
    await expect(page.getByText("7/10")).toBeVisible();
  });

  test("should display Google Ads ad group performance", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Ad Group Performance");

    // Mock ad group data
    await context.route("**/google-ads/ad-groups*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          adGroups: [
            {
              id: "ag_1",
              name: "Products - Electronics",
              campaignName: "Shopping Campaign",
              status: "active",
              impressions: 250000,
              clicks: 7500,
              cost: 450000,
              conversions: 500,
            },
            {
              id: "ag_2",
              name: "Products - Fashion",
              campaignName: "Shopping Campaign",
              status: "active",
              impressions: 180000,
              clicks: 5400,
              cost: 320000,
              conversions: 350,
            },
          ],
        }),
      });
    });

    await page.goto("/integrated");
    // Navigate to ad groups tab
    await page
      .locator('button:has-text("광고그룹"), button:has-text("Ad Groups")')
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Should display ad groups
    await expect(page.getByText("Products - Electronics")).toBeVisible();
    await expect(page.getByText("Products - Fashion")).toBeVisible();
  });

  test("should show Google Ads location targeting performance", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Location Performance");

    // Mock location data
    await context.route("**/google-ads/locations*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          locations: [
            {
              criterionId: "1009871", // Seoul
              locationName: "서울",
              impressions: 500000,
              clicks: 15000,
              cost: 900000,
              conversions: 1000,
            },
            {
              criterionId: "1009877", // Busan
              locationName: "부산",
              impressions: 150000,
              clicks: 4000,
              cost: 240000,
              conversions: 250,
            },
          ],
        }),
      });
    });

    await page.goto("/integrated");
    // Navigate to locations tab
    await page
      .locator('button:has-text("지역"), button:has-text("Locations")')
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Filter by Google Ads
    await page.getByRole("combobox", { name: /플랫폼/i }).click();
    await page.getByRole("option", { name: "Google Ads" }).click();

    // Should show location performance
    await expect(page.getByText("서울")).toBeVisible();
    await expect(page.getByText("부산")).toBeVisible();

    // Verify metrics
    await expect(page.getByText("500,000")).toBeVisible(); // Seoul impressions
    await expect(page.getByText("150,000")).toBeVisible(); // Busan impressions
  });

  test("should handle Google Ads API rate limits", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Rate Limit Handling");

    // Mock rate limit error
    await context.route("**/google-ads/**", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            code: 429,
            message: "Resource has been exhausted",
            status: "RESOURCE_EXHAUSTED",
            details: [
              {
                quotaLimit: "DailyLimit",
                quotaUsage: "15000",
                quotaMax: "15000",
              },
            ],
          },
        }),
      });
    });

    await page.goto("/integrated");

    // Try to refresh data
    const refreshButton = page.getByRole("button", {
      name: /새로고침|Refresh/i,
    });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Should show rate limit message
      await expect(
        page.getByText(/API 한도.*초과|Rate limit exceeded/i),
      ).toBeVisible();
      await expect(
        page.getByText(/나중에.*다시|Try again later/i),
      ).toBeVisible();
    }
  });

  test("should export Google Ads data in multiple formats", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Data Export Formats");

    // Mock export endpoints
    const formats = ["xlsx", "csv", "pdf"] as const;
    for (const format of formats) {
      await context.route(
        `**/export/google-ads?format=${format}`,
        async (route) => {
          const contentTypes: Record<string, string> = {
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            csv: "text/csv",
            pdf: "application/pdf",
          };

          await route.fulfill({
            status: 200,
            contentType: contentTypes[format],
            body: Buffer.from(`mock ${format} data`),
            headers: {
              "Content-Disposition": `attachment; filename=google-ads-export.${format}`,
            },
          });
        },
      );
    }

    await page.goto("/integrated");
    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Click export menu
    await page.locator('[data-testid="export-button"]').click();

    // Verify all export options
    await expect(
      page.getByRole("menuitem", { name: "Excel (.xlsx)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "CSV (.csv)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "PDF 보고서" }),
    ).toBeVisible();
  });

  test("should show Google Ads account hierarchy for MCC", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "MCC Account Hierarchy");

    // Mock MCC hierarchy
    await context.route("**/google-ads/account-hierarchy*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          mccAccount: {
            id: "123-456-7890",
            name: "MCC Master Account",
            isManager: true,
            childAccounts: [
              {
                id: "111-111-1111",
                name: "Client Account 1",
                status: "active",
                spend: 1500000,
              },
              {
                id: "222-222-2222",
                name: "Client Account 2",
                status: "active",
                spend: 1000000,
              },
            ],
          },
        }),
      });
    });

    await page.goto("/integrated");
    await page
      .locator(
        'button:has-text("계정 관리"), button:has-text("Account Management")',
      )
      .first()
      .click();
    await page.waitForLoadState("networkidle");

    // Should show MCC structure
    await expect(page.getByText("MCC Master Account")).toBeVisible();
    await expect(page.getByText("Client Account 1")).toBeVisible();
    await expect(page.getByText("Client Account 2")).toBeVisible();

    // Should show account selector
    const accountSelector = page.getByRole("combobox", {
      name: /계정 선택|Select Account/i,
    });
    await expect(accountSelector).toBeVisible();
  });
});
