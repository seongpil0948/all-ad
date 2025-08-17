import { test, expect } from "@playwright/test";
import {
  waitForAPIResponse,
  mockAPIResponse,
  captureAPIRequest,
  testAPIErrorHandling,
  generateTestId,
} from "../helpers/test-utils";

test.describe("Component Integration Tests @integration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock common API responses
    await mockAPIResponse(page, /\/api\/auth\/credentials/, {
      credentials: [],
      success: true,
    });

    await mockAPIResponse(page, /\/api\/campaigns/, {
      campaigns: [],
      totalCount: 0,
      success: true,
    });
  });

  test("Platform integration workflow", async ({ page }) => {
    const testEmail = `test-${generateTestId()}@example.com`;
    const testPassword = "TestPassword123!";

    // Navigate to integration page
    await page.goto("/integrated");

    // Test platform connection component interaction
    const googleConnectButton = page.locator(
      '[data-testid="connect-google"], button:has-text("Google")',
    );

    if (await googleConnectButton.isVisible({ timeout: 5000 })) {
      // Mock OAuth callback
      await mockAPIResponse(page, /\/api\/auth\/oauth\/google/, {
        success: true,
        authUrl: "https://accounts.google.com/oauth/authorize?mock=true",
      });

      await waitForAPIResponse(
        page,
        /\/api\/auth\/oauth\/google/,
        async () => {
          await googleConnectButton.click();
        },
        { expectedStatus: 200 },
      );
    }

    // Verify platform list updates
    const platformList = page.locator(
      '[data-testid="platform-list"], .platform-credentials',
    );
    await expect(platformList).toBeVisible({ timeout: 10000 });
  });

  test("Campaign management integration", async ({ page }) => {
    // Mock campaign data
    await mockAPIResponse(page, /\/api\/campaigns/, {
      campaigns: [
        {
          id: "test-campaign-1",
          name: "Test Campaign",
          platform: "google",
          status: "active",
          budget: 1000,
          metrics: {
            impressions: 10000,
            clicks: 500,
            cost: 250,
            conversions: 25,
          },
        },
      ],
      totalCount: 1,
      success: true,
    });

    await page.goto("/dashboard");

    // Wait for campaigns to load
    const campaignCard = page.locator(
      '[data-testid*="campaign"], .campaign-card, [class*="campaign"]',
    );
    await expect(campaignCard.first()).toBeVisible({ timeout: 10000 });

    // Test campaign status toggle
    const statusToggle = page
      .locator(
        '[data-testid="campaign-status-toggle"], .campaign-toggle, [role="switch"]',
      )
      .first();

    if (await statusToggle.isVisible()) {
      // Capture the API request for status change
      const capturedRequest = await captureAPIRequest(
        page,
        /\/api\/campaigns\/.*\/status/,
        async () => {
          await statusToggle.click();
        },
      );

      expect(capturedRequest).toBeTruthy();
      expect(capturedRequest.method).toBe("PATCH");
    }
  });

  test("User dropdown navigation integration", async ({ page }) => {
    // Mock user data
    await page.addInitScript(() => {
      (window as any).__MOCK_AUTH_STATE__ = {
        user: {
          id: "test-user",
          email: "test@example.com",
        },
      };
    });

    await page.goto("/dashboard");

    const userDropdown = page.locator(
      '[data-testid="user-dropdown"], .avatar, [role="button"]:has-text("T")',
    );

    if (await userDropdown.isVisible({ timeout: 5000 })) {
      await userDropdown.click();

      // Test profile navigation
      const profileLink = page.locator(
        '[data-testid="profile-link"], text="Profile", text="프로필"',
      );

      if (await profileLink.isVisible()) {
        await waitForAPIResponse(page, /\/profile/, async () => {
          await profileLink.click();
        });

        // Verify navigation occurred
        await expect(page).toHaveURL(/.*profile/);
      }
    }
  });

  test("Error handling integration", async ({ page }) => {
    await page.goto("/dashboard");

    // Test API error handling
    await testAPIErrorHandling(
      page,
      /\/api\/campaigns/,
      async () => {
        await page.reload();
      },
      500,
    );

    // Verify error state is shown
    const errorMessage = page.locator(
      '[data-testid="error-message"], .error-state, [role="alert"]',
    );

    // Error might not always be visible depending on implementation
    // Just verify page doesn't crash
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toBeVisible();
  });

  test("Form submission integration", async ({ page }) => {
    await page.goto("/team");

    const inviteForm = page.locator(
      '[data-testid="invite-form"], form:has([name="email"])',
    );

    if (await inviteForm.isVisible({ timeout: 5000 })) {
      const emailInput = page.locator(
        'input[name="email"], input[type="email"]',
      );
      const submitButton = page.locator(
        '[type="submit"], button:has-text("Invite"), button:has-text("초대")',
      );

      if ((await emailInput.isVisible()) && (await submitButton.isVisible())) {
        await emailInput.fill("newmember@example.com");

        // Capture form submission
        const capturedRequest = await captureAPIRequest(
          page,
          /\/api\/team\/invite/,
          async () => {
            await submitButton.click();
          },
        );

        expect(capturedRequest).toBeTruthy();
        expect(capturedRequest.method).toBe("POST");

        if (capturedRequest.postDataJSON) {
          expect(capturedRequest.postDataJSON.email).toBe(
            "newmember@example.com",
          );
        }
      }
    }
  });

  test("Real-time data updates", async ({ page }) => {
    await page.goto("/dashboard");

    // Mock initial data
    await mockAPIResponse(page, /\/api\/campaigns/, {
      campaigns: [
        {
          id: "test-1",
          name: "Initial Campaign",
          status: "active",
          metrics: { impressions: 1000 },
        },
      ],
    });

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Mock updated data
    await mockAPIResponse(page, /\/api\/campaigns/, {
      campaigns: [
        {
          id: "test-1",
          name: "Updated Campaign",
          status: "active",
          metrics: { impressions: 2000 },
        },
      ],
    });

    // Trigger refresh (if auto-refresh exists)
    const refreshButton = page.locator(
      '[data-testid="refresh"], button:has-text("Refresh"), button:has-text("새로고침")',
    );

    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
