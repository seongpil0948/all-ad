import { AnnotationType, test, expect } from "../tester";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Landing Page Access Without Auth", () => {
  test.beforeEach(async ({ page, pushAnnotation, context }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증 정보 없이 접근");
    // context.storageState({ path: undefined });
    // context.clearCookies();
    // context.storageState();
    // await page.goto("/"); // Go to the starting url before each test.
  });

  test("로그인 버튼 확인", async ({ pushAnnotation, page }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "인증 정보 없이 접근");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "로그인 버튼 활성화 확인");
    // await expect(page).toHaveURL((url) => {
    //   const pathName = url.pathname;
    //   return pathName.includes('login');
    // });

    // await expect(page.getByTestId('login-input-id')).toBeVisible();
    // await expect(page.getByTestId('login-input-pw')).toBeVisible();
    // await expect(page.getByTestId('login-submit')).toBeVisible();

    // await expect(page.getByTestId('login-input-id')).toBeEditable();
    // await expect(page.getByTestId('login-input-pw')).toBeEditable();
    // await expect(page.getByTestId('login-submit')).toHaveAttribute('type', 'submit');
  });
});
