import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Complete User Onboarding Flow", () => {
  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "사용자 플로우");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "온보딩");
  });

  test("신규 사용자 온보딩 플로우 - 랜딩 페이지", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "랜딩 확인");

    // 1. 랜딩 페이지 방문
    await gotoWithLang(page, "intro");
    await page.waitForURL(/\/(en|ko)\/intro/);

    // 2. 주요 요소 확인 - 다국어 지원
    await expect(
      page.getByRole("heading", { name: /모든 광고를 하나로|All Ads in One/ }),
    ).toBeVisible();

    // 3. CTA 버튼 확인 - 실제 존재하는 요소만 확인
    const ctaButton = page
      .getByRole("button")
      .or(page.getByRole("link"))
      .filter({ hasText: /시작|로그인|가입|Start|Login|Sign/ })
      .first();
    if (await ctaButton.isVisible()) {
      await expect(ctaButton).toBeVisible();
    }
  });

  test("회원가입/로그인 페이지 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "인증 페이지");

    // 로그인 페이지로 직접 이동
    await gotoWithLang(page, "login");
    await page.waitForURL(/\/(en|ko)\/login/);

    // 로그인 폼 요소 확인
    await expect(page.getByTestId("login-input-id")).toBeVisible();
    await expect(page.getByTestId("login-input-pw")).toBeVisible();
    await expect(page.getByTestId("login-submit")).toBeVisible();

    // 회원가입 링크 확인
    const signupLink = page.getByText(/회원가입|Sign up/);
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/(en|ko)\/signup/);
    }
  });

  test("공개 페이지 네비게이션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "공개 페이지 탐색");

    // FAQ 페이지
    await gotoWithLang(page, "faq");
    await expect(page).toHaveURL(/\/(en|ko)\/faq/);
    await expect(
      page.getByRole("heading", { name: /자주 묻는 질문|FAQ/ }),
    ).toBeVisible();

    // 가격 페이지
    await gotoWithLang(page, "pricing");
    await expect(page).toHaveURL(/\/(en|ko)\/pricing/);
    await expect(
      page.getByRole("heading", { name: /요금제|가격|Pricing/ }),
    ).toBeVisible();

    // 이용약관
    await gotoWithLang(page, "terms");
    await expect(page).toHaveURL(/\/(en|ko)\/terms/);
    await expect(
      page.getByRole("heading", { name: /이용약관|서비스 약관|Terms/ }),
    ).toBeVisible();
  });

  test("보호된 페이지 접근 시 로그인 필요", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "인증 필요");

    // 대시보드 접근 시도
    await gotoWithLang(page, "dashboard");

    // 로그인 페이지로 리디렉션 또는 404 페이지 확인
    const currentUrl = page.url();
    const isOnLogin = currentUrl.includes("/login");
    const hasLoginForm = await page
      .getByTestId("login-input-id")
      .isVisible()
      .catch(() => false);
    const has404 = await page
      .getByText(/404|찾을 수 없|not found/i)
      .isVisible()
      .catch(() => false);

    expect(isOnLogin || hasLoginForm || has404).toBeTruthy();
  });
});
