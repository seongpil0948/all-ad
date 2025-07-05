import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Google Ads Campaign Management", () => {
  test.use({ storageState: "tests/asset/storageState.json" });

  test.beforeEach(async ({ page, pushAnnotation, context }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Google Ads Integration");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Campaign Management");

    // Mock Google Ads connected account
    await context.route("**/platform_credentials*", async (route) => {
      if (
        route.request().method() === "GET" &&
        route.request().url().includes("platform=google")
      ) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "google-cred-1",
                platform: "google",
                is_active: true,
                account_name: "Test Google Ads Account",
                account_id: "123-456-7890",
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await await gotoWithLang(page, "integrated");
    await page.waitForLoadState("networkidle");
  });

  test("should display Google Ads campaigns in integrated view", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Campaign List Display");

    // Mock campaigns data
    await context.route("**/campaigns*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "google_1001",
                name: "Summer Sale Campaign",
                platform: "google",
                status: "active",
                budget: 50000,
                impressions: 125000,
                clicks: 3500,
                cost: 45000,
                conversions: 250,
                ctr: 2.8,
                cpc: 12.86,
                updated_at: new Date().toISOString(),
              },
              {
                id: "google_1002",
                name: "Brand Awareness",
                platform: "google",
                status: "paused",
                budget: 30000,
                impressions: 85000,
                clicks: 1200,
                cost: 28000,
                conversions: 100,
                ctr: 1.41,
                cpc: 23.33,
                updated_at: new Date().toISOString(),
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to campaigns tab
    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");

    // Filter by Google Ads
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Check campaign display
    await expect(page.getByText("Summer Sale Campaign")).toBeVisible();
    await expect(page.getByText("Brand Awareness")).toBeVisible();

    // Check metrics display
    await expect(page.getByText("125,000")).toBeVisible(); // Impressions
    await expect(page.getByText("3,500")).toBeVisible(); // Clicks
    await expect(page.getByText("₩45,000")).toBeVisible(); // Cost
  });

  test("should toggle campaign status (ON/OFF)", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Campaign Status Toggle");

    // Mock campaign and mutation
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Test Campaign",
              platform: "google",
              status: "active",
              budget: 50000,
            },
          ],
        }),
      });
    });

    await context.route("**/google-ads/campaigns/*/toggle", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Find toggle switch
    const toggleSwitch = page.locator(
      '[data-testid="campaign-toggle-google_1001"]',
    );
    await expect(toggleSwitch).toBeVisible();

    // Click to pause campaign
    await toggleSwitch.click();

    // Confirmation dialog should appear
    await expect(
      page.getByText(/캠페인을 일시정지하시겠습니까/i),
    ).toBeVisible();

    // Confirm
    await page.getByRole("button", { name: "확인" }).click();

    // Success message
    await expect(page.getByText(/캠페인.*변경.*성공/i)).toBeVisible();
  });

  test("should update campaign budget", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Budget Update");

    // Mock campaign data
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Test Campaign",
              platform: "google",
              budget: 50000,
            },
          ],
        }),
      });
    });

    await context.route("**/google-ads/campaigns/*/budget", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Click budget to edit
    const budgetCell = page.locator(
      '[data-testid="campaign-budget-google_1001"]',
    );
    await budgetCell.click();

    // Budget edit modal should appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("예산 수정")).toBeVisible();

    // Enter new budget
    const budgetInput = page.getByLabel("일일 예산");
    await budgetInput.clear();
    await budgetInput.fill("75000");

    // Save
    await page.getByRole("button", { name: "저장" }).click();

    // Success message
    await expect(page.getByText(/예산.*업데이트.*성공/i)).toBeVisible();
  });

  test("should handle bulk campaign operations", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Bulk Operations");

    // Mock multiple campaigns
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Campaign 1",
              platform: "google",
              status: "active",
            },
            {
              id: "google_1002",
              name: "Campaign 2",
              platform: "google",
              status: "active",
            },
            {
              id: "google_1003",
              name: "Campaign 3",
              platform: "google",
              status: "paused",
            },
          ],
        }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Select multiple campaigns
    await page.locator('[data-testid="campaign-checkbox-google_1001"]').check();
    await page.locator('[data-testid="campaign-checkbox-google_1002"]').check();

    // Bulk actions should appear
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    await expect(page.getByText("2개 선택됨")).toBeVisible();

    // Click bulk pause
    await page.locator('[data-testid="bulk-pause"]').click();

    // Confirmation
    await expect(page.getByText(/2개의 캠페인을 일시정지/i)).toBeVisible();
    await page.getByRole("button", { name: "확인" }).click();

    // Success
    await expect(page.getByText(/일괄.*성공/i)).toBeVisible();
  });

  test("should show campaign performance metrics", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Performance Metrics");

    // Mock detailed campaign data
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Performance Campaign",
              platform: "google",
              impressions: 1500000,
              clicks: 45000,
              cost: 350000,
              conversions: 2500,
              ctr: 3.0,
              conversionRate: 5.56,
              cpc: 7.78,
              cpa: 140,
              averageCpm: 233.33,
            },
          ],
        }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Check all metrics are displayed
    await expect(page.getByText("1,500,000")).toBeVisible(); // Impressions
    await expect(page.getByText("45,000")).toBeVisible(); // Clicks
    await expect(page.getByText("3.0%")).toBeVisible(); // CTR
    await expect(page.getByText("₩7.78")).toBeVisible(); // CPC
    await expect(page.getByText("5.56%")).toBeVisible(); // Conversion Rate
    await expect(page.getByText("₩140")).toBeVisible(); // CPA
  });

  test("should handle campaign errors gracefully", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Error Handling");

    // Mock API errors
    await context.route("**/google-ads/campaigns/*/toggle", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Campaign is already in the requested state",
        }),
      });
    });

    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Test Campaign",
              platform: "google",
              status: "active",
            },
          ],
        }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Try to toggle campaign
    const toggleSwitch = page.locator(
      '[data-testid="campaign-toggle-google_1001"]',
    );
    await toggleSwitch.click();
    await page.getByRole("button", { name: "확인" }).click();

    // Error message should appear
    await expect(page.getByText(/이미 요청한 상태입니다/i)).toBeVisible();
  });

  test("should filter campaigns by status", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Status Filter");

    // Mock campaigns with different statuses
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Active Campaign",
              platform: "google",
              status: "active",
            },
            {
              id: "google_1002",
              name: "Paused Campaign",
              platform: "google",
              status: "paused",
            },
            {
              id: "google_1003",
              name: "Removed Campaign",
              platform: "google",
              status: "removed",
            },
          ],
        }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Apply status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.click();
    await page.getByRole("option", { name: "활성" }).click();

    // Only active campaigns should be visible
    await expect(page.getByText("Active Campaign")).toBeVisible();
    await expect(page.getByText("Paused Campaign")).not.toBeVisible();
    await expect(page.getByText("Removed Campaign")).not.toBeVisible();
  });

  test("should support campaign search", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Campaign Search");

    // Mock campaigns
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            { id: "google_1001", name: "Summer Sale 2024", platform: "google" },
            {
              id: "google_1002",
              name: "Winter Collection",
              platform: "google",
            },
            {
              id: "google_1003",
              name: "Black Friday Sale",
              platform: "google",
            },
          ],
        }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Search for "sale"
    const searchInput = page.locator('[data-testid="campaign-search"]');
    await searchInput.fill("sale");
    await searchInput.press("Enter");

    // Should show matching campaigns
    await expect(page.getByText("Summer Sale 2024")).toBeVisible();
    await expect(page.getByText("Black Friday Sale")).toBeVisible();
    await expect(page.getByText("Winter Collection")).not.toBeVisible();
  });

  test("should export campaign data", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Data Export");

    // Mock campaigns
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            { id: "google_1001", name: "Export Test", platform: "google" },
          ],
        }),
      });
    });

    // Mock export endpoint
    const downloadPromise = page.waitForEvent("download");
    await context.route("**/campaigns/export*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        body: Buffer.from("mock excel data"),
        headers: {
          "Content-Disposition":
            "attachment; filename=google-ads-campaigns.xlsx",
        },
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Click export button
    await page.locator('[data-testid="export-button"]').click();
    await page.getByRole("menuitem", { name: "Excel 다운로드" }).click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("google-ads-campaigns");
  });

  test("should show campaign details on click", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Campaign Details");

    // Mock campaign with detailed data
    await context.route("**/campaigns*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "google_1001",
              name: "Detailed Campaign",
              platform: "google",
              status: "active",
              budget: 100000,
              impressions: 500000,
              clicks: 15000,
              created_at: "2024-01-01T00:00:00Z",
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      });
    });

    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    await campaignsTab.click();
    await page.waitForLoadState("networkidle");
    // Click Google Ads filter/tab
    const googleTab = page.locator('button:has-text("Google Ads")').first();
    await googleTab.click();
    await page.waitForTimeout(500);

    // Click campaign name
    await page.getByText("Detailed Campaign").click();

    // Details panel/modal should appear
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("캠페인 상세 정보")).toBeVisible();

    // Check details
    await expect(page.getByText("캠페인 ID: google_1001")).toBeVisible();
    await expect(page.getByText("생성일: 2024-01-01")).toBeVisible();
    await expect(page.getByText("플랫폼: Google Ads")).toBeVisible();
  });
});
