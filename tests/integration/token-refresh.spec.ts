import { test, expect, AnnotationType } from "../tester";

test.describe("Token Refresh", () => {
  test.use({ storageState: "tests/asset/storageState.json" });

  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Integration Tests");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Token Management");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Token Refresh");
  });

  test("should automatically attempt token refresh for expired tokens", async ({
    page,
    context,
  }) => {
    // Mock expired token credential
    await context.route("**/api/auth/refresh*", async (route) => {
      const url = route.request().url();

      if (url.includes("accountId=")) {
        // Token validation check
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            hasValidToken: false,
          }),
        });
      } else if (route.request().method() === "POST") {
        // Token refresh attempt
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Token refreshed successfully",
          }),
        });
      }
    });

    // Navigate to integrated page
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // Click on platforms tab
    const platformsTab = page.getByRole("tab", { name: /플랫폼 연동/i });
    await platformsTab.click();

    // Wait for token refresh to complete
    await page.waitForTimeout(2000);

    // Should not show re-auth button if refresh succeeded
    const reAuthButton = page.getByRole("button", { name: "재연동" });
    await expect(reAuthButton).not.toBeVisible();
  });

  test("should show re-authentication button when token refresh fails", async ({
    page,
    context,
  }) => {
    // Mock failed token refresh
    await context.route("**/api/auth/refresh*", async (route) => {
      const url = route.request().url();

      if (url.includes("accountId=")) {
        // Token validation check
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            hasValidToken: false,
          }),
        });
      } else if (route.request().method() === "POST") {
        // Token refresh attempt fails
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "Token refresh failed",
          }),
        });
      }
    });

    // Mock platform credentials with expired token
    await page.route("**/platform_credentials*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "test-id",
                platform: "google",
                is_active: true,
                account_name: "test@example.com",
                account_id: "google_123_456",
                expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
                data: {
                  user_email: "test@example.com",
                },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to integrated page
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // Click on platforms tab
    const platformsTab = page.getByRole("tab", { name: /플랫폼 연동/i });
    await platformsTab.click();

    // Wait for token check
    await page.waitForTimeout(2000);

    // Should show re-auth button
    const reAuthButton = page.getByRole("button", { name: "재연동" });
    await expect(reAuthButton).toBeVisible();
  });

  test("should handle re-authentication flow", async ({ page, context }) => {
    // Setup mocks for failed token with re-auth button
    await context.route("**/api/auth/refresh*", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: "Token expired",
        }),
      });
    });

    await page.route("**/platform_credentials*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "test-id",
              platform: "google",
              is_active: true,
              account_name: "test@example.com",
              account_id: "google_123_456",
              expires_at: new Date(Date.now() - 1000).toISOString(),
            },
          ],
        }),
      });
    });

    // Navigate to integrated page
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // Click on platforms tab
    const platformsTab = page.getByRole("tab", { name: /플랫폼 연동/i });
    await platformsTab.click();

    // Wait for re-auth button
    await page.waitForTimeout(2000);
    const reAuthButton = page.getByRole("button", { name: "재연동" });
    await expect(reAuthButton).toBeVisible();

    // Mock successful re-auth
    await context.route("**/api/auth/google-ads", async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: "https://accounts.google.com/oauth2/v2/auth",
        },
      });
    });

    // Click re-auth button
    const [navigation] = await Promise.all([
      page.waitForNavigation(),
      reAuthButton.click(),
    ]);

    // Should redirect to OAuth flow
    expect(navigation?.url()).toContain("api/auth/google-ads");
  });

  test("should not show error state for valid tokens", async ({
    page,
    context,
  }) => {
    // Mock valid token check
    await context.route("**/api/auth/refresh*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          hasValidToken: true,
        }),
      });
    });

    // Mock platform credentials with valid token
    await page.route("**/platform_credentials*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "test-id",
              platform: "google",
              is_active: true,
              account_name: "test@example.com",
              account_id: "google_123_456",
              expires_at: new Date(Date.now() + 3600000).toISOString(), // Valid for 1 hour
              data: {
                user_email: "test@example.com",
              },
            },
          ],
        }),
      });
    });

    // Navigate to integrated page
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // Click on platforms tab
    const platformsTab = page.getByRole("tab", { name: /플랫폼 연동/i });
    await platformsTab.click();

    // Should show connected status without errors
    await expect(page.getByText("연동됨")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();

    // Should not show re-auth button
    const reAuthButton = page.getByRole("button", { name: "재연동" });
    await expect(reAuthButton).not.toBeVisible();
  });

  test("should show toast notification on token refresh success", async ({
    page,
    context,
  }) => {
    // Mock successful token refresh
    await context.route("**/api/auth/refresh*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            message: "Token refreshed successfully",
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            hasValidToken: false,
          }),
        });
      }
    });

    // Navigate to integrated page
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // Click on platforms tab
    const platformsTab = page.getByRole("tab", { name: /플랫폼 연동/i });
    await platformsTab.click();

    // Wait for token refresh
    await page.waitForTimeout(2000);

    // Should show success toast
    const toast = page.locator('[data-has-title="true"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(/토큰.*갱신.*성공|Token.*refreshed/i);
  });
});
