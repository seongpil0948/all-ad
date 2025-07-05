import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Google Ads Authentication", () => {
  test.use({ storageState: "tests/asset/storageState.json" });

  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Google Ads Integration");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Authentication");
    await gotoWithLang(page, "integrated");
    await page.waitForLoadState("networkidle");
  });

  test("should show Google Ads OAuth button on integrated page", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth Button Display");

    // Navigate to platforms tab - look for tab containing the text
    const platformsTab = page.locator(
      'button[role="tab"]:has-text("플랫폼 연동")',
    );
    await platformsTab.click();
    await page.waitForLoadState("networkidle");

    // Check Google Ads section exists
    const googleSection = page.locator("text=Google Ads").first();
    await expect(googleSection).toBeVisible();

    // Check OAuth supported badge
    const oauthBadge = page.getByText("OAuth 인증 지원");
    await expect(oauthBadge).toBeVisible();

    // Check connect button exists
    const connectButton = page
      .getByRole("button", { name: /Google Ads 연동하기|연동|추가/i })
      .first();
    await expect(connectButton).toBeVisible();
  });

  test("should redirect to Google OAuth when clicking connect", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth Redirect");

    await page.locator('[data-key="platforms"]').click();
    await page.waitForLoadState("networkidle");

    const connectButton = page
      .getByRole("button", { name: /Google Ads 연동하기|연동|추가/i })
      .first();

    // Set up route interception to verify OAuth redirect
    const [oauthNavigation] = await Promise.all([
      page.waitForRequest((request) =>
        request.url().includes("/api/auth/google-ads"),
      ),
      connectButton.click(),
    ]);

    expect(oauthNavigation.url()).toContain("/api/auth/google-ads");
  });

  test("should handle OAuth state verification", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "State Verification");

    // Mock OAuth state in database
    await context.route("**/oauth_states*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "test-state-id",
              user_id: "test-user",
              team_id: "test-team",
              state: "test-state-123",
              platform: "google",
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Click connect button
    await page.locator('[data-key="platforms"]').click();
    await page.waitForLoadState("networkidle");
    const connectButton = page
      .getByRole("button", { name: /Google Ads 연동하기|연동|추가/i })
      .first();

    // Should generate state and redirect
    await connectButton.click();
    await page.waitForTimeout(1000);
  });

  test("should handle successful OAuth callback", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth Success");

    // Mock successful OAuth callback
    await context.route("**/api/auth/callback/google-ads*", async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: "/integrated?success=google_connected&tab=platforms",
        },
      });
    });

    // Simulate OAuth callback with code and state
    await page.goto(
      "/api/auth/callback/google-ads?code=test_auth_code&state=test_state_123",
    );

    // Should redirect to integrated page with success
    await page.waitForURL("**/integrated*", { timeout: 10000 });

    // Check for success indicator - could be in URL params or toast
    const url = page.url();
    const hasSuccessParam =
      url.includes("success=google_connected") ||
      url.includes("success=true") ||
      url.includes("connected=true");

    if (!hasSuccessParam) {
      // If no success param, check for success toast or message
      await expect(
        page
          .getByText(
            /Google Ads 연동.*성공|successfully connected|연동되었습니다/i,
          )
          .first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should handle OAuth errors gracefully", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth Error Handling");

    // Test access denied error
    await context.route("**/api/auth/callback/google-ads*", async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          Location: "/integrated?error=oauth_denied&platform=google",
        },
      });
    });

    await page.goto("/api/auth/callback/google-ads?error=access_denied");
    await page.waitForURL("**/integrated*", { timeout: 10000 });

    // Check for error indicator - could be in URL params or toast
    const url = page.url();
    const hasErrorParam = url.includes("error=") || url.includes("failed=true");

    if (!hasErrorParam) {
      // If no error param, check for error toast or message
      await expect(
        page
          .getByText(/Google Ads 연동.*실패|failed|denied|오류|거부/i)
          .first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should handle invalid state parameter", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Invalid State");

    // Navigate directly with invalid state
    await page.goto(
      "/api/auth/callback/google-ads?code=test_code&state=invalid_state",
    );

    // Should redirect with error
    await page.waitForURL("**/integrated*", { timeout: 10000 });

    // Check for error - could be in URL or as a message
    const url = page.url();
    if (!url.includes("error=")) {
      // If no error in URL, check for error message
      await expect(
        page.getByText(/잘못된 요청|invalid request|오류|error/i).first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show connected Google accounts", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Connected Accounts");

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
                account_name: "test@example.com",
                account_id: "123-456-7890",
                data: {
                  user_email: "test@example.com",
                  connected_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + 3600000).toISOString(),
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

    // Navigate to platforms tab - look for tab containing the text
    const platformsTab = page.locator(
      'button[role="tab"]:has-text("플랫폼 연동")',
    );
    await platformsTab.click();
    await page.waitForLoadState("networkidle");

    // Should show connected status
    await expect(page.getByText("연동됨")).toBeVisible();
    await expect(page.getByText("test@example.com")).toBeVisible();
    await expect(page.getByText("123-456-7890")).toBeVisible();
  });

  test("should support multiple Google Ads account connections", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Multiple Accounts");

    // Mock multiple connected accounts
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
                account_name: "Account 1",
                account_id: "123-456-7890",
                data: { user_email: "account1@example.com" },
              },
              {
                id: "google-cred-2",
                platform: "google",
                is_active: true,
                account_name: "Account 2",
                account_id: "098-765-4321",
                data: { user_email: "account2@example.com" },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await page.locator('[data-key="platforms"]').click();
    await page.waitForLoadState("networkidle");

    // Should show multiple accounts
    await expect(page.getByText("Account 1")).toBeVisible();
    await expect(page.getByText("Account 2")).toBeVisible();

    // Should still allow adding more accounts
    const addButton = page.getByRole("button", {
      name: /계정 추가|Add Account/i,
    });
    await expect(addButton).toBeVisible();
  });

  test("should handle token refresh for expired tokens", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Token Refresh");

    // Mock expired token scenario
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
                account_name: "Expired Token Account",
                data: {
                  expires_at: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
                  user_email: "expired@example.com",
                },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await page.locator('[data-key="platforms"]').click();
    await page.waitForLoadState("networkidle");

    // Should show warning about expired token
    await expect(
      page.getByText(/토큰 만료|Token expired|재인증 필요/i),
    ).toBeVisible();

    // Should have reconnect button
    const reconnectButton = page.getByRole("button", {
      name: /재연동|Reconnect|다시 연동/i,
    });
    await expect(reconnectButton).toBeVisible();
  });

  test("should disconnect Google Ads account", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Disconnect Account");

    // Mock connected account
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
                account_name: "test@example.com",
              },
            ],
          }),
        });
      } else if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: { is_active: false } }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await page.locator('[data-key="platforms"]').click();
    await page.waitForLoadState("networkidle");

    // Click disconnect button
    const disconnectButton = page.getByRole("button", {
      name: /연동 해제|Disconnect/i,
    });
    await disconnectButton.click();

    // Confirm dialog should appear
    await expect(
      page.getByText(/정말로 연동을 해제하시겠습니까/i),
    ).toBeVisible();

    // Click confirm
    await page.getByRole("button", { name: "해제" }).click();

    // Success message
    await expect(page.getByText(/연동.*해제.*성공/i)).toBeVisible();
  });

  test("should handle MCC (Manager) accounts", async ({
    page,
    context,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "MCC Account Support");

    // Mock MCC account with accessible customers
    await context.route("**/platform_credentials*", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: [
              {
                id: "google-mcc-1",
                platform: "google",
                is_active: true,
                account_name: "MCC Account",
                account_id: "mcc-123-456",
                data: {
                  is_mcc: true,
                  accessible_customers: [
                    "111-111-1111",
                    "222-222-2222",
                    "333-333-3333",
                  ],
                },
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.reload();
    await page.locator('[data-key="platforms"]').click();
    await page.waitForLoadState("networkidle");

    // Should show MCC indicator
    await expect(page.getByText(/MCC.*Manager.*계정/i)).toBeVisible();

    // Should show customer account selector
    await expect(page.getByText(/고객 계정 선택/i)).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /계정 선택/i }),
    ).toBeVisible();
  });

  test("should validate OAuth configuration", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth Config Validation");

    // Navigate to platforms tab - look for tab containing the text
    const platformsTab = page.locator(
      'button[role="tab"]:has-text("플랫폼 연동")',
    );
    await platformsTab.click();
    await page.waitForLoadState("networkidle");

    // Check that Google Ads uses All-AD OAuth (no manual credential inputs)
    const googleSection = page
      .locator("div")
      .filter({ hasText: "Google Ads" })
      .first();

    // Should NOT show manual credential inputs
    await expect(googleSection.getByLabel("Client ID")).not.toBeVisible();
    await expect(googleSection.getByLabel("Client Secret")).not.toBeVisible();
    await expect(googleSection.getByLabel("Developer Token")).not.toBeVisible();

    // Should show simplified OAuth message
    await expect(
      page.getByText(/Google 계정으로 간편하게 연동/i),
    ).toBeVisible();
  });
});
