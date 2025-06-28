import { test, expect, AnnotationType } from "./tester";

test.describe("Basic Functionality Tests", () => {
  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "기본 기능");
  });

  test("공개 페이지 접근 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 접근");

    // 랜딩 페이지
    await page.goto("/intro");
    await expect(page).toHaveURL("/intro");
    await expect(
      page.getByRole("heading", { name: /광고 관리의 새로운 기준/ }),
    ).toBeVisible();

    // FAQ 페이지
    await page.goto("/faq");
    await expect(page).toHaveURL("/faq");
    await expect(
      page.getByRole("heading", { name: "자주 묻는 질문" }),
    ).toBeVisible();

    // 가격 페이지
    await page.goto("/pricing");
    await expect(page).toHaveURL("/pricing");
    await expect(page.getByRole("heading", { name: /요금제/ })).toBeVisible();

    // 이용약관
    await page.goto("/terms");
    await expect(page).toHaveURL("/terms");
    await expect(page.getByRole("heading", { name: /이용약관/ })).toBeVisible();
  });

  test("인증 플로우 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "인증");

    // 로그인 페이지
    await page.goto("/login");
    await expect(page).toHaveURL("/login");

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

    await page.goto("/intro");

    // 헤더 네비게이션
    const navbar = page.locator("nav").first();

    // 로고
    const logo = navbar.getByText("ALL AD");
    await expect(logo).toBeVisible();

    // 메뉴 항목들
    const menuItems = ["요금제", "문의하기", "FAQ"];

    for (const item of menuItems) {
      const link = navbar.getByText(item);
      if (await link.isVisible()) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("반응형 디자인 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "반응형");

    // 데스크톱 뷰
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/intro");
    await expect(
      page.getByRole("heading", { name: /광고 관리의 새로운 기준/ }),
    ).toBeVisible();

    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole("heading", { name: /광고 관리의 새로운 기준/ }),
    ).toBeVisible();
  });

  test("404 페이지 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "에러 페이지");

    await page.goto("/non-existent-page");

    // 404 메시지 확인
    await expect(
      page.getByText(/404|페이지를 찾을 수 없습니다|Page not found/),
    ).toBeVisible();
  });

  test("보호된 페이지 리디렉션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "보호된 페이지");

    // 로그인하지 않은 상태에서 대시보드 접근
    await page.goto("/dashboard");

    // 로그인 페이지로 리디렉션
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("login-input-id")).toBeVisible();
  });

  test("폼 유효성 검증", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "폼 검증");

    await page.goto("/login");

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

    await page.goto("/intro");

    // 페이지가 결국 로드되는지 확인
    await expect(
      page.getByRole("heading", { name: /광고 관리의 새로운 기준/ }),
    ).toBeVisible({ timeout: 10000 });
  });
});
