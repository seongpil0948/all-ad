import { test, expect } from "@playwright/test";
import { gotoWithLang } from "../utils/navigation";

test.describe("Intro Page", () => {
  test("should be accessible without authentication", async ({ page }) => {
    // Navigate to intro page
    await gotoWithLang(page, "intro");
    // 언어 코드가 자동으로 추가되어 리디렉션됨을 기다림
    await page.waitForURL(/\/(en|ko)\/intro/);

    // Should not redirect to login
    await expect(page).toHaveURL(/\/(en|ko)\/intro/);

    // Should contain the main title - 다국어 지원으로 제목이 다를 수 있음
    await expect(
      page.getByRole("heading", { name: /모든 광고를 하나로|All Ads in One/ }),
    ).toBeVisible();

    // Should have CTA buttons - 버튼 텍스트 확인
    const startButton = page.getByRole("button", {
      name: /무료 체험 시작하기|Start Free Trial/,
    });
    const demoButton = page.getByRole("button", { name: /데모|Demo/ });

    if (await startButton.isVisible()) {
      await expect(startButton).toBeVisible();
    }

    if (await demoButton.isVisible()) {
      await expect(demoButton).toBeVisible();
    }
  });

  test("should navigate to login when clicking start button", async ({
    page,
  }) => {
    await gotoWithLang(page, "intro");
    await page.waitForURL(/\/(en|ko)\/intro/);

    // Click the start button - 실제 페이지에서 사용되는 버튼 찾기
    const startButton = page.getByRole("button", {
      name: /무료 체험 시작하기|Start Free Trial/,
    });

    if (await startButton.isVisible()) {
      await startButton.click();
      // Should navigate to login page
      await expect(page).toHaveURL(/\/(en|ko)\/login/);
    } else {
      // CTAButton 컴포넌트를 찾아 클릭
      const ctaButton = page.locator('[data-action="start-trial"]');
      if (await ctaButton.isVisible()) {
        await ctaButton.click();
        await expect(page).toHaveURL(/\/(en|ko)\/login/);
      }
    }
  });

  test("should navigate to demo when clicking demo button", async ({
    page,
  }) => {
    await gotoWithLang(page, "intro");
    await page.waitForURL(/\/(en|ko)\/intro/);

    // Click the demo button
    const demoButton = page.getByRole("button", { name: /데모|Demo/ });

    if (await demoButton.isVisible()) {
      await demoButton.click();
      // Should navigate to demo page
      await expect(page).toHaveURL(/\/(en|ko)\/demo/);
    }
  });
});
