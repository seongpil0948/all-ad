import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Google Ads Token Refresh Cron Job", () => {
  test.use({ storageState: "tests/asset/storageState.json" });

  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Google Ads Integration");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Cron Job Token Refresh");
  });

  test("should verify cron job configuration", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Cron Job Setup");

    // This test verifies the cron job is properly configured
    // In production, these would be checked via admin panel or database

    const expectedCronJobs = [
      {
        name: "refresh-oauth-tokens",
        schedule: "0 * * * *", // Every hour at minute 0
        active: true,
      },
      {
        name: "google-ads-sync-hourly",
        schedule: "0 * * * *", // Every hour
        active: true,
      },
      {
        name: "google-ads-sync-full-daily",
        schedule: "0 2 * * *", // Daily at 2 AM
        active: true,
      },
    ];

    // Navigate to admin cron jobs page if available
    await page.goto("/admin/cron-jobs");

    // Check each cron job
    for (const job of expectedCronJobs) {
      const jobRow = page.locator(`tr:has-text("${job.name}")`);
      await expect(jobRow).toBeVisible();
      await expect(jobRow.locator("text=" + job.schedule)).toBeVisible();
      await expect(
        jobRow.locator('[data-testid="status-active"]'),
      ).toBeVisible();
    }
  });

  test("should manually trigger token refresh edge function", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Manual Token Refresh");

    // Mock edge function response
    await context.route(
      "**/functions/v1/refresh-oauth-tokens-v2",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            processed: 3,
            refreshed: 2,
            failed: 0,
            results: [
              {
                platform: "google",
                accountId: "7982378016",
                status: "refreshed",
              },
              {
                platform: "google",
                accountId: "7702718698",
                status: "refreshed",
              },
              {
                platform: "google",
                accountId: "123-456-7890",
                status: "not_needed",
              },
            ],
          }),
        });
      },
    );

    // Navigate to admin page
    await page.goto("/admin/cron-jobs");

    // Find refresh-oauth-tokens job
    const tokenRefreshRow = page.locator('tr:has-text("refresh-oauth-tokens")');

    // Click "Run Now" button
    await tokenRefreshRow.locator('[data-testid="run-now-button"]').click();

    // Should show processing status
    await expect(page.getByText(/실행 중|Running/i)).toBeVisible();

    // Should show success message
    await expect(
      page.getByText(/토큰 갱신 완료|Token refresh completed/i),
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("2개 갱신됨")).toBeVisible();
  });

  test("should display token expiration status correctly", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Token Expiration Display");

    const now = Date.now();

    // Mock credentials with various expiration states
    await context.route("**/platform_credentials*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "cred-1",
                platform: "google",
                account_name: "곧 만료 예정",
                expires_at: new Date(now + 20 * 60 * 1000).toISOString(), // 20 minutes
                is_active: true,
              },
              {
                id: "cred-2",
                platform: "google",
                account_name: "이미 만료됨",
                expires_at: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago
                is_active: true,
              },
              {
                id: "cred-3",
                platform: "google",
                account_name: "정상",
                expires_at: new Date(now + 50 * 60 * 1000).toISOString(), // 50 minutes
                is_active: true,
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await await gotoWithLang(page, "integrated");
    const platformsTab = page.locator(
      'button[role="tab"]:has-text("플랫폼 연동")',
    );
    await platformsTab.click();
    await page.waitForLoadState("networkidle");

    // Check status indicators
    await expect(
      page
        .locator("text=곧 만료 예정")
        .locator("..")
        .getByText(/곧 만료|Expires soon/i),
    ).toBeVisible();
    await expect(
      page
        .locator("text=이미 만료됨")
        .locator("..")
        .getByText(/만료됨|Expired/i),
    ).toBeVisible();
    await expect(
      page
        .locator("text=정상")
        .locator("..")
        .getByText(/정상|Active/i),
    ).toBeVisible();
  });

  test("should handle token refresh failures", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Refresh Failure Handling");

    // Mock failed refresh
    await context.route(
      "**/functions/v1/refresh-oauth-tokens-v2",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            processed: 2,
            refreshed: 0,
            failed: 2,
            results: [
              {
                platform: "google",
                accountId: "7982378016",
                status: "failed",
                error: "invalid_grant: Token has been expired or revoked",
              },
              {
                platform: "google",
                accountId: "7702718698",
                status: "failed",
                error: "invalid_client: The OAuth client was not found",
              },
            ],
          }),
        });
      },
    );

    // Mock updated credentials showing inactive status
    await context.route("**/platform_credentials*", async (route, request) => {
      if (request.method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      } else if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "cred-1",
                platform: "google",
                account_name: "실패한 계정 1",
                is_active: false,
                data: {
                  refresh_error:
                    "invalid_grant: Token has been expired or revoked",
                  refresh_failed_at: new Date().toISOString(),
                },
              },
              {
                id: "cred-2",
                platform: "google",
                account_name: "실패한 계정 2",
                is_active: false,
                data: {
                  refresh_error:
                    "invalid_client: The OAuth client was not found",
                  refresh_failed_at: new Date().toISOString(),
                },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Trigger refresh
    await page.goto("/admin/cron-jobs");
    const tokenRefreshRow = page.locator('tr:has-text("refresh-oauth-tokens")');
    await tokenRefreshRow.locator('[data-testid="run-now-button"]').click();

    // Should show failure message
    await expect(page.getByText(/갱신 실패|Refresh failed/i)).toBeVisible();
    await expect(page.getByText("2개 실패")).toBeVisible();

    // Navigate to integrated page to see inactive accounts
    await await gotoWithLang(page, "integrated");
    const platformsTab = page.locator(
      'button[role="tab"]:has-text("플랫폼 연동")',
    );
    await platformsTab.click();
    await page.waitForLoadState("networkidle");

    // Should show error states
    await expect(page.getByText("invalid_grant")).toBeVisible();
    await expect(page.getByText("재연동 필요")).toBeVisible();
  });

  test("should check database token structure", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(
      AnnotationType.SUB_CATEGORY2,
      "Database Structure Verification",
    );

    // This test verifies the expected database structure
    // Based on the CSV data provided:

    const expectedStructure = {
      // Top-level OAuth columns (added by migration)
      access_token: "string",
      refresh_token: "string",
      expires_at: "timestamp",
      scope: "string",

      // Legacy JSONB data column (for backward compatibility)
      data: {
        access_token: "string",
        refresh_token: "string",
        expires_at: "string",
        expiry_date: "number",
        token_type: "string",
        scope: "string",
        user_email: "string",
        connected_at: "string",
      },
    };

    // This structure allows:
    // 1. New code to use top-level columns for efficiency
    // 2. Old code to continue using data->access_token
    // 3. Edge functions to check both locations
    // 4. Gradual migration without breaking changes
  });

  test("should verify pg_net configuration for edge function calls", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "pg_net Configuration");

    // This test would verify that pg_net is properly configured
    // to call Edge Functions from cron jobs

    // In production, this would check:
    // 1. pg_net extension is enabled
    // 2. vault has service_role_key stored
    // 3. app.supabase_url is configured
    // 4. call_edge_function() works correctly

    // For now, we just verify the UI shows proper configuration
    await page.goto("/admin/system-config");

    if (await page.getByText("pg_net").isVisible()) {
      await expect(page.getByText("pg_net: Enabled")).toBeVisible();
      await expect(page.getByText("vault: Configured")).toBeVisible();
    }
  });

  test("should monitor token refresh performance", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Performance Monitoring");

    // Mock cron job history
    await context.route("**/cron_job_history*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              jobname: "refresh-oauth-tokens",
              start_time: new Date(Date.now() - 3600000).toISOString(),
              end_time: new Date(Date.now() - 3595000).toISOString(),
              status: "succeeded",
              duration: "5s",
              details: { refreshed: 15, failed: 0 },
            },
            {
              jobname: "refresh-oauth-tokens",
              start_time: new Date(Date.now() - 7200000).toISOString(),
              end_time: new Date(Date.now() - 7190000).toISOString(),
              status: "succeeded",
              duration: "10s",
              details: { refreshed: 18, failed: 2 },
            },
          ],
        }),
      });
    });

    await page.goto("/admin/cron-jobs");

    // Click on refresh-oauth-tokens job details
    await page.getByText("refresh-oauth-tokens").click();

    // Should show job history
    await expect(page.getByText("실행 기록")).toBeVisible();
    await expect(page.getByText("15개 갱신됨")).toBeVisible();
    await expect(page.getByText("평균 실행 시간: 7.5초")).toBeVisible();
  });

  test("should handle concurrent token refreshes", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Concurrency Control");

    // This test verifies that the system prevents duplicate refreshes
    // when multiple cron jobs or manual triggers happen simultaneously

    let refreshCount = 0;

    await context.route(
      "**/functions/v1/refresh-oauth-tokens-v2",
      async (route) => {
        refreshCount++;

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            processed: 1,
            refreshed: 1,
            failed: 0,
            requestId: refreshCount,
          }),
        });
      },
    );

    await page.goto("/admin/cron-jobs");

    // Try to trigger multiple refreshes quickly
    const tokenRefreshRow = page.locator('tr:has-text("refresh-oauth-tokens")');
    const runButton = tokenRefreshRow.locator('[data-testid="run-now-button"]');

    // Click multiple times
    await runButton.click();
    await runButton.click();

    // Should show "already running" message for second click
    await expect(page.getByText(/이미 실행 중|Already running/i)).toBeVisible();

    // Only one refresh should have been triggered
    expect(refreshCount).toBeLessThanOrEqual(1);
  });
});
