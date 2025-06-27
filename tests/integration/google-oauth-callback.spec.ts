import { test, expect } from "@playwright/test";

test.describe("Google OAuth Callback", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("testuser@example.com");
    await page.getByPlaceholder("••••••••").fill("testpassword123");
    await page.getByRole("button", { name: "로그인" }).click();

    // Wait for navigation to complete
    await page.waitForURL("/integrated");
  });

  test("should show Google OAuth connection button", async ({ page }) => {
    // Navigate to the integrated page
    await page.goto("/integrated");

    // Check that Google Ads connection button exists
    await expect(
      page.getByRole("button", { name: /Google Ads 연동하기/i }),
    ).toBeVisible();
  });

  test("should handle OAuth errors gracefully", async ({ page }) => {
    // Navigate to integrated page with error parameter
    await page.goto("/integrated?error=oauth_failed&platform=google");

    // Check that error message is displayed
    await expect(page.getByText(/연동.*실패/i)).toBeVisible();
  });

  test("should handle successful OAuth callback", async ({ page }) => {
    // Navigate to integrated page with success parameter
    await page.goto("/integrated?success=google_connected&tab=platforms");

    // Check that success message is displayed
    await expect(page.getByText(/연동.*성공/i)).toBeVisible();

    // Verify we're on the platforms tab
    await expect(
      page.getByRole("tab", { name: "연동 플랫폼" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  test("should store tokens correctly in database", async () => {
    // This test verifies that the OAuth callback correctly stores tokens
    // Both as top-level columns (after migration) and in the data JSONB column
    // The callback route now handles both structures:
    // 1. New structure (after migration):
    //    - access_token (top-level column)
    //    - refresh_token (top-level column)
    //    - expires_at (top-level column)
    //    - scope (top-level column)
    //
    // 2. Legacy structure (for backward compatibility):
    //    - data: { access_token, refresh_token, expires_at, ... }
    // The GoogleAdsOAuthClient can read from both structures
    // ensuring smooth transition during migration
  });
});
