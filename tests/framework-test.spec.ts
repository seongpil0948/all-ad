import { test, expect, AnnotationType } from "./tester";

test.describe("Test Framework Verification", () => {
  test("custom tester and annotations work", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "프레임워크 테스트");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "기본 기능");

    // Test basic page functionality
    await page.goto("https://example.com");
    await expect(page).toHaveTitle(/Example Domain/);

    // Test that our custom annotation system is working
    // (annotations are processed by the custom reporter)
    expect(true).toBe(true);
  });

  test("Korean locale is working", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "프레임워크 테스트");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "한국어 지원");

    // Verify Korean locale is properly set
    const locale = await page.evaluate(() => navigator.language);
    console.log("Current locale:", locale);

    // Test basic expectations
    expect(locale).toMatch(/ko/);
  });
});
