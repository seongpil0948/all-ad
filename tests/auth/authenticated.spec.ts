// import { PAGE_PATH } from '@/config/site';
import { AnnotationType, test, expect } from "../tester";
import testConfig from "../config";

test.describe("Landing Page Access With Auth", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증 페이지 접근");
    await page.context().storageState({ path: testConfig.statePath });
    await page.goto("/"); // Go to the starting url before each test.
  });
  test("인증된 상태에서 보호된 직거래 접근", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "직거래 프로모션 접근");
    // playwright.config.ts에 지정된 storageState 덕분에 이미 인증된 상태
    // await page.goto(PAGE_PATH.promotionDirect);
    // await expect(page.getByTestId('page-title')).toContainText('직거래 프로모션 관리');
  });

  test("인증된 상태에서 멤버십 페이지 접근", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "멤버십 프로모션 접근");
    // await page.goto(PAGE_PATH.promotionMembership);
    // await expect(page.getByTestId('page-title')).toContainText('멤버십 프로모션 관리');
  });
});
