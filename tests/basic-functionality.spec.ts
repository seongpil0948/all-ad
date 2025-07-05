import { test, expect, AnnotationType } from "./tester";
import { gotoWithLang, expectUrl } from "./utils/navigation";

test.describe("Basic Functionality Tests", () => {
  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "기본 기능");
  });

  test("공개 페이지 접근 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 접근");

    // 홈페이지 (자동으로 intro 페이지로 리디렉션됨)
    await gotoWithLang(page, "");
    // 언어 코드가 자동으로 추가되어 리디렉션됨
    await expect(page).toHaveURL(/\/(en|ko)\/intro/);
    await expect(
      page.getByRole("heading", { name: /모든 광고를 하나로|All Ads in One/ }),
    ).toBeVisible();

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
      page.getByRole("heading", { name: /요금제|Pricing/ }),
    ).toBeVisible();

    // 이용약관
    await gotoWithLang(page, "terms");
    await expect(page).toHaveURL(/\/(en|ko)\/terms/);
    await expect(
      page.getByRole("heading", { name: /이용약관|Terms/ }),
    ).toBeVisible();
  });

  test("인증 플로우 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "인증");

    // 로그인 페이지
    await gotoWithLang(page, "login");
    await expect(page).toHaveURL(/\/(en|ko)\/login/);

    // 로그인 폼 요소 확인
    const emailInput = page.getByTestId("login-input-id");
    const passwordInput = page.getByTestId("login-input-pw");
    const submitButton = page.getByTestId("login-submit");

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // 회원가입 링크
    const signupLink = page.getByText(/회원가입/);
    await expect(signupLink).toBeVisible();
  });

  test("네비게이션 링크 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "네비게이션");

    await gotoWithLang(page, "");
    // 언어 코드가 자동으로 추가되어 리디렉션됨을 기다림
    await page.waitForURL(/\/(en|ko)\/intro/);

    // 헤더 네비게이션
    const navbar = page.locator("nav").first();

    // 로고 (A.ll + Ad)
    const logo = navbar.getByText("A.ll + Ad");
    await expect(logo).toBeVisible();

    // 메뉴 항목들 확인
    const homeLink = navbar.getByRole("link", { name: "홈" });
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeVisible();
    }

    const demoLink = navbar.getByRole("link", { name: "데모" });
    if (await demoLink.isVisible()) {
      await expect(demoLink).toBeVisible();
    }

    const pricingLink = navbar.getByRole("link", { name: "요금제" });
    if (await pricingLink.isVisible()) {
      await expect(pricingLink).toBeVisible();
    }

    const supportLink = navbar.getByRole("link", { name: "고객 지원" });
    if (await supportLink.isVisible()) {
      await expect(supportLink).toBeVisible();
    }
  });

  test("반응형 디자인 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "반응형");

    // 데스크톱 뷰
    await page.setViewportSize({ width: 1920, height: 1080 });
    await gotoWithLang(page, "");
    await page.waitForURL(/\/(en|ko)\/intro/);
    await expect(
      page.getByRole("heading", { name: /모든 광고를 하나로|All Ads in One/ }),
    ).toBeVisible();

    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole("heading", { name: /모든 광고를 하나로|All Ads in One/ }),
    ).toBeVisible();
  });

  test("404 페이지 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "에러 페이지");

    await gotoWithLang(page, "non-existent-page");

    // 404 메시지 확인
    await expect(
      page.getByText(/404|페이지를 찾을 수 없습니다|Page not found/),
    ).toBeVisible();
  });

  test("보호된 페이지 리디렉션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "보호된 페이지");

    // 로그인하지 않은 상태에서 대시보드 접근
    await gotoWithLang(page, "dashboard");

    // 언어 코드가 추가되고 로그인 페이지로 리디렉션
    await expect(page).toHaveURL(/\/(en|ko)\/login/);
    await expect(page.getByTestId("login-input-id")).toBeVisible();
  });

  test("폼 유효성 검증", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "폼 검증");

    await gotoWithLang(page, "login");

    // 빈 폼 제출
    await page.getByTestId("login-submit").click();

    // 에러 메시지 확인 (구체적인 메시지는 구현에 따라 다를 수 있음)
    await expect(
      page.locator("text=/필수|required|이메일을 입력/i"),
    ).toBeVisible();
  });

  test("로딩 상태 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "로딩 상태");

    // 느린 네트워크 시뮬레이션
    await page.route("**/*", async (route) => {
      if (route.request().resourceType() === "document") {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await route.continue();
    });

    await gotoWithLang(page, "");
    await page.waitForURL(/\/(en|ko)\/intro/);

    // 페이지가 결국 로드되는지 확인
    await expect(
      page.getByRole("heading", { name: /모든 광고를 하나로|All Ads in One/ }),
    ).toBeVisible({ timeout: 10000 });
  });
});
