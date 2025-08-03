import { test, expect } from "@playwright/test";

test.describe("TikTok Platform Integration", () => {
  test.use({ storageState: "./tests/asset/storageState.json" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/platforms");
    await page.waitForLoadState("networkidle");
  });

  test("should display TikTok in platform list", async ({ page }) => {
    // Check if TikTok is listed in available platforms
    const tiktokCard = page.locator('[data-platform="tiktok"]');
    await expect(tiktokCard).toBeVisible();

    // Verify TikTok branding
    await expect(tiktokCard.locator("text=TikTok Ads")).toBeVisible();
  });

  test("should show OAuth connection option for TikTok", async ({ page }) => {
    // Click on TikTok platform card
    await page.click('[data-platform="tiktok"]');

    // Should show OAuth connection button
    const connectButton = page.locator(
      'button:has-text("Connect TikTok Account")',
    );
    await expect(connectButton).toBeVisible();

    // Should not show manual credential inputs
    const apiKeyInput = page.locator('input[placeholder*="API Key"]');
    await expect(apiKeyInput).not.toBeVisible();
  });

  test("should initiate TikTok OAuth flow", async ({ page, context }) => {
    // Click on TikTok platform card
    await page.click('[data-platform="tiktok"]');

    // Start monitoring for popup
    const popupPromise = context.waitForEvent("page");

    // Click connect button
    await page.click('button:has-text("Connect TikTok Account")');

    // Wait for OAuth popup
    const popup = await popupPromise;

    // Verify OAuth URL
    expect(popup.url()).toContain("tiktok.com");
    expect(popup.url()).toContain("v2/auth/authorize");
    expect(popup.url()).toContain("client_key=");

    // Close popup
    await popup.close();
  });

  test("should display connected TikTok accounts", async ({ page }) => {
    // Mock a connected TikTok account
    await page.route("**/api/platforms/credentials*", async (route) => {
      const response = {
        credentials: [
          {
            id: "test-tiktok-cred",
            platform: "tiktok",
            account_name: "Test TikTok Account",
            is_active: true,
            last_synced_at: new Date().toISOString(),
          },
        ],
      };
      await route.fulfill({ json: response });
    });

    await page.reload();
    await page.waitForLoadState("networkidle");

    // Check for connected account
    const connectedAccount = page.locator('text="Test TikTok Account"');
    await expect(connectedAccount).toBeVisible();
  });

  test("should handle TikTok OAuth callback", async ({ page }) => {
    // Simulate OAuth callback
    await page.goto(
      "/api/auth/callback/tiktok?code=test_code&state=test_state",
    );

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);

    // Should show success message
    const successToast = page.locator(
      '[role="alert"]:has-text("TikTok account connected")',
    );
    await expect(successToast).toBeVisible({ timeout: 10000 });
  });

  test("should sync TikTok campaign data", async ({ page }) => {
    // Mock campaign sync endpoint
    await page.route("**/api/sync*", async (route) => {
      if (route.request().postData()?.includes("tiktok")) {
        await route.fulfill({
          json: {
            success: true,
            campaigns_synced: 5,
            metrics_synced: 35,
          },
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to campaigns page
    await page.goto("/dashboard/campaigns");

    // Click sync button
    await page.click('button:has-text("Sync Data")');

    // Should show sync progress
    const syncProgress = page.locator('text="Syncing TikTok campaigns"');
    await expect(syncProgress).toBeVisible();

    // Should show success message
    const successMessage = page.locator('text="5 campaigns synced"');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
  });

  test("should display TikTok campaigns in dashboard", async ({ page }) => {
    // Mock TikTok campaigns
    await page.route("**/api/campaigns*", async (route) => {
      const response = {
        campaigns: [
          {
            id: "tiktok-campaign-1",
            platform: "tiktok",
            name: "Summer Sale TikTok",
            status: "active",
            budget: 1000,
            impressions: 50000,
            clicks: 2500,
            cost: 250,
          },
        ],
      };
      await route.fulfill({ json: response });
    });

    await page.goto("/dashboard/campaigns");
    await page.waitForLoadState("networkidle");

    // Filter by TikTok platform
    await page.click('[data-platform-filter="tiktok"]');

    // Should display TikTok campaign
    const campaign = page.locator('text="Summer Sale TikTok"');
    await expect(campaign).toBeVisible();

    // Should show TikTok platform badge
    const platformBadge = page.locator(
      '[data-campaign="tiktok-campaign-1"] [data-platform-badge="tiktok"]',
    );
    await expect(platformBadge).toBeVisible();
  });

  test("should handle TikTok API errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route(
      "**/api/platforms/tiktok/test-connection*",
      async (route) => {
        await route.fulfill({
          status: 401,
          json: {
            error: "Invalid access token",
            code: 40100,
          },
        });
      },
    );

    await page.goto("/dashboard/platforms");

    // Try to test connection
    await page.click(
      '[data-platform="tiktok"] button:has-text("Test Connection")',
    );

    // Should show error message
    const errorMessage = page.locator(
      'text="Authentication failed. Please reconnect your TikTok account."',
    );
    await expect(errorMessage).toBeVisible();
  });

  test("should refresh TikTok OAuth tokens", async ({ page }) => {
    // Mock token refresh
    await page.route("**/api/auth/refresh/tiktok*", async (route) => {
      await route.fulfill({
        json: {
          success: true,
          access_token: "new_access_token",
          expires_in: 86400,
        },
      });
    });

    // Simulate token expiration scenario
    await page.goto("/dashboard/campaigns");

    // Should automatically refresh token when making API calls
    await page.click('button:has-text("Sync Data")');

    // Should not show authentication error
    const authError = page.locator('text="Authentication failed"');
    await expect(authError).not.toBeVisible({ timeout: 5000 });
  });
});
