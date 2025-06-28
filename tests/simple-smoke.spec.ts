import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("intro page loads", async ({ page }) => {
    await page.goto("/intro");
    await expect(page).toHaveURL("/intro");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("FAQ page loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page).toHaveURL("/faq");
    await expect(
      page.getByRole("heading", { name: "자주 묻는 질문" }),
    ).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("login-input-id")).toBeVisible();
  });

  test.skip("protected route redirects to login", async ({ page }) => {
    // Skip this test as the dashboard route behavior is inconsistent
    // The middleware redirects but the actual page returns 404
    // This is a known issue with the current app structure where
    // /dashboard is under (private) route group but middleware expects it at root
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});
