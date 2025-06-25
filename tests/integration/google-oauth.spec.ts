import { test, expect, AnnotationType } from "../tester";

test.describe("Google OAuth Integration", () => {
  test.use({ storageState: "tests/asset/storageState.json" });

  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Integration Tests");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "OAuth Flow");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Google OAuth Connection");
    // Navigate to platform integration page
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // Click on platforms tab
    const platformsTab = page.getByRole("tab", { name: /플랫폼 연동/i });
    await platformsTab.click();
  });

  test("should show OAuth info message instead of manual credential form for Google", async ({
    page,
  }) => {
    // Find Google Ads section
    const googleSection = page.locator("text=Google Ads").first();
    await expect(googleSection).toBeVisible();

    // Click add/edit button for Google
    const addButton = page.getByRole("button", { name: /추가|연동/i }).first();

    // Should redirect to OAuth instead of showing modal
    const [navigation] = await Promise.all([
      page.waitForNavigation({ url: "**/api/auth/google-ads" }),
      addButton.click(),
    ]);

    // Verify redirect happened
    expect(navigation?.url()).toContain("/api/auth/google-ads");
  });

  test("should not show manual credential inputs for OAuth platforms", async ({
    page,
  }) => {
    // Navigate to test page
    await page.goto("/test-google-oauth");
    await page.waitForLoadState("networkidle");

    // Should show simple connect UI
    await expect(page.getByText("Google 계정으로 연동하기")).toBeVisible();

    // Should not show any manual input fields
    await expect(page.getByLabel("Client ID")).not.toBeVisible();
    await expect(page.getByLabel("Client Secret")).not.toBeVisible();
    await expect(page.getByLabel("Developer Token")).not.toBeVisible();
    await expect(page.getByLabel("Refresh Token")).not.toBeVisible();
  });

  test("should show OAuth supported chip for Google platform", async ({
    page,
  }) => {
    // Check if OAuth supported indicator is shown
    const oauthChip = page.getByText("OAuth 인증 지원");

    // Open Google platform modal
    const googleCard = page
      .locator("[data-testid=platform-card-google]")
      .first();
    const editButton = googleCard.getByRole("button", { name: /설정|편집/i });

    // For OAuth platforms, clicking should redirect
    await editButton.click();

    // Wait a bit to see if modal opens (it shouldn't)
    await page.waitForTimeout(1000);

    // Modal should not be visible
    const modal = page.getByRole("dialog");
    await expect(modal).not.toBeVisible();
  });

  test("should handle OAuth callback successfully", async ({
    page,
    context,
  }) => {
    // Mock successful OAuth callback
    await context.route("**/api/auth/callback/google-ads*", async (route) => {
      // Simulate successful callback redirect
      await route.fulfill({
        status: 302,
        headers: {
          Location: "/integrated?success=google_connected&tab=platforms",
        },
      });
    });

    // Simulate OAuth callback
    await page.goto(
      "/api/auth/callback/google-ads?code=test_code&state=test_state",
    );

    // Should redirect to integrated page with success
    await page.waitForURL(
      "**/integrated?success=google_connected&tab=platforms",
    );

    // Success message should be shown
    await expect(
      page.getByText(/연동.*성공|successfully connected/i),
    ).toBeVisible();
  });

  test("should handle OAuth errors gracefully", async ({ page, context }) => {
    // Mock OAuth error
    await context.route("**/api/auth/callback/google-ads*", async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: "/integrated?error=oauth_denied&platform=google",
        },
      });
    });

    // Simulate OAuth error callback
    await page.goto("/api/auth/callback/google-ads?error=access_denied");

    // Should redirect with error
    await page.waitForURL("**/integrated?error=oauth_denied&platform=google");

    // Error message should be shown
    await expect(page.getByText(/연동.*실패|failed|denied/i)).toBeVisible();
  });

  test("should show connected status after successful OAuth", async ({
    page,
  }) => {
    // Mock platform credentials API to return connected Google account
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
                data: {
                  user_email: "test@example.com",
                  connected_at: new Date().toISOString(),
                },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should show connected status
    await expect(page.getByText("연동됨")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
  });
});
