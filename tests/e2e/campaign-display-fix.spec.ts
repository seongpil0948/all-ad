import { test, expect } from "@playwright/test";
import { login } from "../helpers/test-utils";

test.describe("Campaign Display with VirtualScrollTable", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "test@example.com", "password123");
  });

  test("should display campaigns in VirtualScrollTable", async ({ page }) => {
    // Navigate to the integrated dashboard
    await page.goto("/integrated");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for the campaign dashboard
    await expect(page.getByText("캠페인 대시보드")).toBeVisible();

    // Wait for API response
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/campaigns") && response.status() === 200,
      { timeout: 10000 },
    );

    // Wait a bit for the data to be rendered
    await page.waitForTimeout(2000);

    // Check debug info
    const debugInfo = await page.locator(".bg-gray-100").textContent();
    console.log("Debug Info:", debugInfo);

    // Check if campaigns are displayed
    const campaignRows = page.locator('[aria-label="캠페인 목록"] .table-row');
    const count = await campaignRows.count();

    if (count > 0) {
      console.log(`Found ${count} campaign rows`);

      // Check first campaign details
      const firstRow = campaignRows.first();
      await expect(firstRow).toBeVisible();

      // Check for platform badge
      const platformBadge = firstRow.locator('[data-testid="platform-badge"]');
      await expect(platformBadge).toBeVisible();
    } else {
      // If no campaigns, check for empty state
      const emptyState = page.getByText("캠페인이 없습니다");
      await expect(emptyState).toBeVisible();
    }
  });
});
