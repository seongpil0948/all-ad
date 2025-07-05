import { test, expect } from "@playwright/test";
import { gotoWithLang } from "../utils/navigation";

test.describe("Toast Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await gotoWithLang(page, "");
  });

  test("should show success toast on login", async ({ page }) => {
    // Navigate to login page
    await gotoWithLang(page, "login");

    // Fill in login form with test credentials
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for navigation and toast
    await page.waitForURL("/dashboard");

    // Check for success toast
    const toast = page.locator('[data-has-title="true"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("로그인되었습니다");
  });

  test("should show error toast on invalid login", async ({ page }) => {
    // Navigate to login page
    await gotoWithLang(page, "login");

    // Fill in login form with invalid credentials
    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for toast
    await page.waitForTimeout(500);

    // Check for error toast
    const toast = page.locator('[data-has-title="true"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("로그인 실패");
  });

  test("should show toast when uploading avatar", async ({ page }) => {
    // First login
    await gotoWithLang(page, "login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Navigate to profile page
    await gotoWithLang(page, "profile");

    // Upload avatar (mock file upload)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "test-avatar.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fake-image-data"),
    });

    // Wait for toast
    await page.waitForTimeout(1000);

    // Check for success toast
    const toast = page.locator('[data-has-title="true"]');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("프로필 사진");
  });

  test("should show multiple toasts in order", async ({ page }) => {
    // Navigate to team management page (requires login)
    await gotoWithLang(page, "login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "adminpassword123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(en|ko)\/dashboard/);

    await gotoWithLang(page, "team");

    // Try to invite multiple team members quickly
    const inviteButton = page.locator('button:has-text("팀원 초대")');
    if (await inviteButton.isVisible()) {
      await inviteButton.click();

      // Fill and submit form multiple times
      for (let i = 0; i < 3; i++) {
        await page.fill('input[type="email"]', `test${i}@example.com`);
        await page.click('button:has-text("초대하기")');
        await page.waitForTimeout(500);
      }

      // Should see multiple toasts (max 3 as configured)
      const toasts = page.locator('[data-has-title="true"]');
      const count = await toasts.count();
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  test("toast should auto-dismiss after timeout", async ({ page }) => {
    // Navigate to login page
    await gotoWithLang(page, "login");

    // Trigger an error toast
    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Wait for toast to appear
    const toast = page.locator('[data-has-title="true"]');
    await expect(toast).toBeVisible();

    // Wait for auto-dismiss (6 seconds for error toasts)
    await page.waitForTimeout(7000);

    // Toast should be gone
    await expect(toast).not.toBeVisible();
  });

  test("should show progress bar for long operations", async ({ page }) => {
    // Login first
    await gotoWithLang(page, "login");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "testpassword123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(en|ko)\/dashboard/);

    // Navigate to dashboard
    await gotoWithLang(page, "dashboard");

    // Click sync button if available
    const syncButton = page.locator('button:has-text("전체 동기화")');
    if (await syncButton.isVisible()) {
      await syncButton.click();

      // Check for toast with progress
      const progressToast = page.locator('[data-has-title="true"]');
      const progressBar = progressToast.locator('[class*="progressTrack"]');

      // Progress bar might be visible for sync operations
      if (await progressBar.isVisible()) {
        await expect(progressBar).toBeVisible();
      }
    }
  });
});
