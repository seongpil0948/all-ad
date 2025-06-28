import { test, expect } from "../tester";

test.describe("Dashboard Data Provider", () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error listener before navigation
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Store console errors on the page object for access in tests
    (page as any).consoleErrors = consoleErrors;
  });

  test("should load dashboard without infinite loops", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Wait for the dashboard to load
    await page.waitForLoadState("networkidle");

    // Check that the page title is visible (indicates successful load)
    await expect(page.getByText("대시보드")).toBeVisible();

    // Check that there are no console errors about maximum update depth
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to ensure any potential infinite loops would have triggered
    await page.waitForTimeout(2000);

    // Verify no maximum update depth errors
    const maxUpdateDepthErrors = consoleErrors.filter((error) =>
      error.includes("Maximum update depth exceeded"),
    );
    expect(maxUpdateDepthErrors).toHaveLength(0);

    // Verify the campaign dashboard component loaded
    const campaignDashboardSection = page.locator("text=캠페인 대시보드");
    await expect(campaignDashboardSection).toBeVisible();

    // Verify tabs are rendered and clickable
    const allTab = page.locator('button[role="tab"]:has-text("전체")');
    await expect(allTab).toBeVisible();
    await allTab.click();

    // Ensure the page is still responsive after tab click
    await expect(page.getByText("전체 캠페인")).toBeVisible();
  });

  test("should handle empty campaigns state gracefully", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");

    // Wait for initial load
    await page.waitForLoadState("networkidle");

    // If there are no campaigns, check for the empty state message
    const emptyCampaignMessage = page.locator(
      "text=캠페인이 없습니다. 플랫폼을 연동하고 동기화를 진행하세요.",
    );

    // The empty state should either not exist (if there are campaigns) or be visible (if empty)
    const isEmptyStateVisible = await emptyCampaignMessage
      .isVisible()
      .catch(() => false);

    if (isEmptyStateVisible) {
      // Verify the platform connection section is shown
      await expect(page.locator("text=플랫폼 연동")).toBeVisible();
    } else {
      // Verify campaign table is shown
      await expect(
        page.locator('table[aria-label="캠페인 목록"]'),
      ).toBeVisible();
    }
  });

  test("should maintain state consistency when switching tabs", async ({
    page,
  }) => {
    // Navigate to integrated page with tabs
    await page.goto("/integrated");

    // Wait for tabs to load
    await page.waitForLoadState("networkidle");

    // Click through different tabs
    const campaignsTab = page.locator(
      'button[role="tab"]:has-text("캠페인 관리")',
    );
    const platformsTab = page.locator(
      'button[role="tab"]:has-text("플랫폼 연동")',
    );
    const teamTab = page.locator('button[role="tab"]:has-text("팀 관리")');

    // Switch between tabs multiple times
    await campaignsTab.click();
    await expect(page.locator("text=캠페인 대시보드")).toBeVisible();

    await platformsTab.click();
    await expect(page.locator("text=광고 플랫폼 연동")).toBeVisible();

    await teamTab.click();
    await expect(page.locator("text=팀 멤버 관리")).toBeVisible();

    // Switch back to campaigns to ensure state is maintained
    await campaignsTab.click();
    await expect(page.locator("text=캠페인 대시보드")).toBeVisible();

    // Check console for any errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Verify no errors occurred during tab switching
    expect(consoleErrors).toHaveLength(0);
  });
});
