import { test, expect } from "@playwright/test";

test.describe("Simple Toast Test", () => {
  test("should show error toast on invalid login", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Fill in login form with invalid credentials
    await page.fill('input[name="email"]', "invalid@example.com");
    await page.fill('input[name="password"]', "wrongpassword");

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for toast to appear
    await page.waitForTimeout(1000);

    // Check for error toast using various selectors
    const toastSelectors = [
      '[data-has-title="true"]',
      ".toast",
      '[role="status"]',
      'div[class*="toast"]',
    ];

    let toastFound = false;
    for (const selector of toastSelectors) {
      const toast = page.locator(selector);
      if (await toast.isVisible().catch(() => false)) {
        toastFound = true;
        // Check if it contains error message
        const text = await toast.textContent();
        console.log(`Toast found with selector ${selector}: ${text}`);
        expect(text).toContain("로그인 실패");
        break;
      }
    }

    if (!toastFound) {
      // If no toast found, check for inline error message
      const errorMessage = page.locator(
        "text=/이메일 또는 비밀번호가 올바르지 않습니다/",
      );
      await expect(errorMessage).toBeVisible();
    }
  });

  test("should show form validation errors", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Wait a bit
    await page.waitForTimeout(500);

    // Check for validation toast or inline message
    const validationMessage = page.locator(
      "text=/유효한 이메일 주소를 입력해주세요/",
    );
    if (await validationMessage.isVisible().catch(() => false)) {
      await expect(validationMessage).toBeVisible();
    } else {
      // Check for toast
      const toast = page.locator('[data-has-title="true"]');
      await expect(toast).toBeVisible();
      const text = await toast.textContent();
      expect(text).toMatch(/이메일|비밀번호/);
    }
  });
});
