import { test, expect } from "@playwright/test";
import {
  generateTestId,
  login,
  logout,
  navigateTo,
  waitForAPIResponse,
  waitForNetworkIdle,
  assertElementReady,
  measurePerformance,
  TestFixtures,
  mockPlatformResponses,
} from "../helpers/test-utils";

test.describe("Complete User Journey E2E Tests @e2e", () => {
  let testEmail: string;
  let testPassword: string;
  let teamId: string;

  test.beforeAll(() => {
    const testId = generateTestId("e2e");
    testEmail = `${testId}@test.com`;
    testPassword = "TestPassword123!";
  });

  test.describe.serial("User Onboarding Flow", () => {
    test("should complete signup process", async ({ page }) => {
      await navigateTo(page, "/login?mode=signup");

      // Fill signup form
      await page.fill('[data-testid="email-input"]', testEmail);
      await page.fill('[data-testid="password-input"]', testPassword);
      await page.fill('[data-testid="password-confirm-input"]', testPassword);
      await page.fill('[data-testid="name-input"]', "Test User");

      // Accept terms
      await page.check('[data-testid="terms-checkbox"]');

      // Submit form with API response wait
      await waitForAPIResponse(page, "/auth/v1/signup", async () => {
        await page.click('[data-testid="signup-button"]');
      });

      // Should redirect to verification page
      await expect(page).toHaveURL(/\/verify-email/);
      await expect(
        page.locator('[data-testid="verification-message"]'),
      ).toBeVisible();
    });

    test("should handle email verification", async ({ page }) => {
      // Simulate email verification click
      const verificationToken = "mock-verification-token";
      await navigateTo(page, `/auth/confirm?token=${verificationToken}`);

      // Should redirect to login after verification
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.locator('[data-testid="verification-success"]'),
      ).toBeVisible();
    });

    test("should login after verification", async ({ page }) => {
      await login(page, testEmail, testPassword);

      // Should be on dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(
        page.locator('[data-testid="welcome-message"]'),
      ).toBeVisible();
    });

    test("should complete initial team setup", async ({ page }) => {
      await navigateTo(page, "/dashboard");

      // Check if team setup modal appears for new users
      const setupModal = page.locator('[data-testid="team-setup-modal"]');
      if (await setupModal.isVisible()) {
        // Fill team information
        await page.fill('[data-testid="team-name-input"]', "Test Team");
        await page.fill(
          '[data-testid="team-description-input"]',
          "E2E Test Team Description",
        );

        // Submit team setup
        await waitForAPIResponse(page, "/rest/v1/teams", async () => {
          await page.click('[data-testid="create-team-button"]');
        });

        // Extract team ID from response or URL
        const url = page.url();
        const match = url.match(/team\/([a-zA-Z0-9-]+)/);
        if (match) {
          teamId = match[1];
        }
      }

      await expect(
        page.locator('[data-testid="dashboard-content"]'),
      ).toBeVisible();
    });
  });

  test.describe("Platform Integration Flow", () => {
    test("should connect Google Ads account @smoke", async ({ page }) => {
      await navigateTo(page, "/dashboard/platforms");

      // Click on Google Ads integration
      await page.click('[data-testid="platform-google"]');

      // Mock OAuth flow
      await page.route("**/oauth/authorize**", async (route) => {
        await route.fulfill({
          status: 302,
          headers: {
            Location: `/auth/callback?code=mock-auth-code&state=google`,
          },
        });
      });

      // Click connect button
      await page.click('[data-testid="connect-google-button"]');

      // Should show success after OAuth callback
      await expect(
        page.locator('[data-testid="connection-success"]'),
      ).toBeVisible();

      // Verify account is listed
      await expect(
        page.locator('[data-testid="google-account-card"]'),
      ).toBeVisible();
    });

    test("should fetch and display campaigns", async ({ page }) => {
      await navigateTo(page, "/dashboard/campaigns");

      // Mock campaign API response
      await page.route("**/campaigns**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockPlatformResponses.google.campaigns),
        });
      });

      // Wait for campaigns to load
      await waitForNetworkIdle(page);

      // Verify campaigns are displayed
      const campaignCards = page.locator('[data-testid="campaign-card"]');
      await expect(campaignCards).toHaveCount(1);

      // Verify campaign details
      const firstCampaign = campaignCards.first();
      await expect(
        firstCampaign.locator('[data-testid="campaign-name"]'),
      ).toContainText("Google Test Campaign");
      await expect(
        firstCampaign.locator('[data-testid="campaign-status"]'),
      ).toContainText("ENABLED");
    });

    test("should toggle campaign status", async ({ page }) => {
      await navigateTo(page, "/dashboard/campaigns");

      // Find active campaign
      const campaignCard = page
        .locator('[data-testid="campaign-card"]')
        .first();
      const toggleButton = campaignCard.locator(
        '[data-testid="status-toggle"]',
      );

      // Get initial status
      const initialStatus = await toggleButton.getAttribute("data-status");
      expect(initialStatus).toBe("active");

      // Toggle status
      await waitForAPIResponse(page, /\/campaigns\/.*\/status/, async () => {
        await toggleButton.click();
      });

      // Confirm in modal
      await page.click('[data-testid="confirm-status-change"]');

      // Verify status changed
      await expect(toggleButton).toHaveAttribute("data-status", "paused");
    });

    test("should update campaign budget", async ({ page }) => {
      await navigateTo(page, "/dashboard/campaigns");

      // Click edit budget
      const campaignCard = page
        .locator('[data-testid="campaign-card"]')
        .first();
      await campaignCard.locator('[data-testid="edit-budget-button"]').click();

      // Update budget in modal
      const budgetModal = page.locator('[data-testid="budget-modal"]');
      await expect(budgetModal).toBeVisible();

      await budgetModal.locator('[data-testid="budget-input"]').fill("5000");

      // Save budget
      await waitForAPIResponse(page, /\/campaigns\/.*\/budget/, async () => {
        await budgetModal.locator('[data-testid="save-budget-button"]').click();
      });

      // Verify budget updated
      await expect(
        campaignCard.locator('[data-testid="campaign-budget"]'),
      ).toContainText("5,000");
    });
  });

  test.describe("Analytics and Reporting", () => {
    test("should display campaign metrics", async ({ page }) => {
      await navigateTo(page, "/dashboard/analytics");

      // Mock metrics API
      await page.route("**/metrics**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockPlatformResponses.google.metrics),
        });
      });

      // Select date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');

      // Wait for metrics to load
      await waitForNetworkIdle(page);

      // Verify metrics cards
      await expect(
        page.locator('[data-testid="metric-impressions"]'),
      ).toContainText("1,000");
      await expect(page.locator('[data-testid="metric-clicks"]')).toContainText(
        "50",
      );
      await expect(page.locator('[data-testid="metric-cost"]')).toContainText(
        "$25",
      );
      await expect(
        page.locator('[data-testid="metric-conversions"]'),
      ).toContainText("5");
    });

    test("should display charts and graphs", async ({ page }) => {
      await navigateTo(page, "/dashboard/analytics");

      // Verify chart containers are present
      await expect(
        page.locator('[data-testid="performance-chart"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="platform-comparison-chart"]'),
      ).toBeVisible();

      // Interact with chart filters
      await page.click('[data-testid="chart-metric-selector"]');
      await page.click('[data-testid="metric-option-ctr"]');

      // Verify chart updated
      await expect(page.locator('[data-testid="chart-title"]')).toContainText(
        "CTR",
      );
    });

    test("should export reports", async ({ page }) => {
      await navigateTo(page, "/dashboard/analytics");

      // Setup download promise before clicking
      const downloadPromise = page.waitForEvent("download");

      // Click export button
      await page.click('[data-testid="export-button"]');

      // Select export format
      await page.click('[data-testid="export-format-csv"]');

      // Wait for download
      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toContain("analytics-report");
      expect(download.suggestedFilename()).toContain(".csv");
    });
  });

  test.describe("Team Management", () => {
    test("should invite team members", async ({ page }) => {
      await navigateTo(page, "/dashboard/team");

      // Click invite button
      await page.click('[data-testid="invite-member-button"]');

      // Fill invitation form
      const inviteModal = page.locator('[data-testid="invite-modal"]');
      await inviteModal
        .locator('[data-testid="email-input"]')
        .fill("teammate@test.com");
      await inviteModal
        .locator('[data-testid="role-select"]')
        .selectOption("team_mate");

      // Send invitation
      await waitForAPIResponse(page, "/rest/v1/team_invitations", async () => {
        await inviteModal.locator('[data-testid="send-invite-button"]').click();
      });

      // Verify invitation sent
      await expect(
        page.locator('[data-testid="invitation-success"]'),
      ).toBeVisible();

      // Verify pending invitation appears in list
      await expect(
        page.locator('[data-testid="pending-invitation"]'),
      ).toContainText("teammate@test.com");
    });

    test("should manage team member roles", async ({ page }) => {
      await navigateTo(page, "/dashboard/team");

      // Find team member
      const memberRow = page.locator('[data-testid="member-row"]').first();

      // Click edit role
      await memberRow.locator('[data-testid="edit-role-button"]').click();

      // Change role
      const roleModal = page.locator('[data-testid="role-modal"]');
      await roleModal
        .locator('[data-testid="role-select"]')
        .selectOption("viewer");

      // Save role change
      await waitForAPIResponse(page, /\/team_members\/.*/, async () => {
        await roleModal.locator('[data-testid="save-role-button"]').click();
      });

      // Verify role updated
      await expect(
        memberRow.locator('[data-testid="member-role"]'),
      ).toContainText("Viewer");
    });
  });

  test.describe("Performance and Accessibility", () => {
    test("should load dashboard quickly", async ({ page }) => {
      const loadTime = await measurePerformance(
        page,
        "Dashboard Load",
        async () => {
          await navigateTo(page, "/dashboard");
        },
      );

      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test("should have proper accessibility attributes", async ({ page }) => {
      await navigateTo(page, "/dashboard");

      // Check for ARIA labels
      const mainContent = page.locator('[role="main"]');
      await expect(mainContent).toBeVisible();

      // Check for keyboard navigation
      await page.keyboard.press("Tab");
      const focusedElement = await page.evaluate(
        () => document.activeElement?.tagName,
      );
      expect(focusedElement).toBeDefined();

      // Check for alt texts on images
      const images = page.locator("img");
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const altText = await images.nth(i).getAttribute("alt");
        expect(altText).toBeDefined();
      }
    });

    test("should handle errors gracefully", async ({ page }) => {
      // Simulate network error
      await page.route("**/api/**", (route) => route.abort());

      await navigateTo(page, "/dashboard/campaigns");

      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

      // Should have retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Restore network
      await page.unroute("**/api/**");

      // Retry should work
      await page.click('[data-testid="retry-button"]');
      await waitForNetworkIdle(page);
    });
  });

  test.afterAll(async ({ page }) => {
    // Cleanup test data
    if (testEmail && testPassword) {
      try {
        await login(page, testEmail, testPassword);
        await navigateTo(page, "/dashboard/settings");

        // Delete account if possible
        const deleteButton = page.locator(
          '[data-testid="delete-account-button"]',
        );
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.fill('[data-testid="confirm-delete-input"]', "DELETE");
          await page.click('[data-testid="confirm-delete-button"]');
        }
      } catch (error) {
        console.log("Cleanup failed:", error);
      }
    }
  });
});
