import { test, expect, AnnotationType } from "../tester";

test.describe("AuthForm Component", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "컴포넌트");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "AuthForm");
  });

  test.describe("Login Mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
    });

    test("로그인 폼 기본 동작", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "로그인 모드");

      // 로그인 폼 요소들
      await expect(page.getByTestId("login-form")).toBeVisible();
      await expect(page.getByTestId("login-input-id")).toBeVisible();
      await expect(page.getByTestId("login-input-pw")).toBeVisible();
      await expect(page.getByTestId("login-submit")).toBeVisible();

      // 입력 필드 아이콘
      await expect(page.locator(".fa-envelope")).toBeVisible();
      await expect(page.locator(".fa-lock")).toBeVisible();
    });

    test("모드 전환 - 로그인에서 회원가입으로", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "모드 전환");

      // 회원가입 링크 클릭
      await page.getByRole("link", { name: "회원가입" }).click();

      // 회원가입 폼으로 전환 확인
      await expect(page.getByTestId("signup-input-email")).toBeVisible();
      await expect(page.getByTestId("signup-input-password")).toBeVisible();
      await expect(page.getByTestId("signup-submit")).toBeVisible();

      // 로그인 링크가 나타나는지 확인
      await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
    });

    test("이메일 자동완성", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동완성");

      const emailInput = page.getByTestId("login-input-id");
      await expect(emailInput).toHaveAttribute("autocomplete", "email");

      const passwordInput = page.getByTestId("login-input-pw");
      await expect(passwordInput).toHaveAttribute(
        "autocomplete",
        "current-password",
      );
    });

    test("비밀번호 입력 보안", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "보안");

      const passwordInput = page.getByTestId("login-input-pw");
      await expect(passwordInput).toHaveAttribute("type", "password");

      // 비밀번호 입력
      await passwordInput.fill("testpassword");

      // 입력값이 마스킹되는지 확인
      const inputType = await passwordInput.getAttribute("type");
      expect(inputType).toBe("password");
    });

    test("로딩 상태", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "로딩 상태");

      // 폼 제출
      await page.getByTestId("login-input-id").fill("test@example.com");
      await page.getByTestId("login-input-pw").fill("password123");

      // 네트워크 요청 인터셉트하여 지연 시뮬레이션
      await page.route("**/api/auth/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.getByTestId("login-submit").click();

      // 로딩 상태 확인
      const submitButton = page.getByTestId("login-submit");
      await expect(submitButton).toHaveAttribute("disabled", "");

      // 로딩 인디케이터 확인
      const loadingIndicator = submitButton.locator(
        "[class*='loading'], [class*='spinner']",
      );
      await expect(loadingIndicator).toBeVisible();
    });
  });

  test.describe("Signup Mode", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/signup");
    });

    test("회원가입 폼 기본 동작", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "회원가입 모드");

      // 회원가입 폼 요소들
      await expect(page.getByTestId("signup-input-email")).toBeVisible();
      await expect(page.getByTestId("signup-input-password")).toBeVisible();
      await expect(page.getByTestId("signup-submit")).toBeVisible();

      // 필수 필드 표시
      const emailInput = page.getByTestId("signup-input-email");
      await expect(emailInput).toHaveAttribute("required", "");

      const passwordInput = page.getByTestId("signup-input-password");
      await expect(passwordInput).toHaveAttribute("required", "");
    });

    test("비밀번호 자동완성 설정", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동완성");

      const passwordInput = page.getByTestId("signup-input-password");
      await expect(passwordInput).toHaveAttribute(
        "autocomplete",
        "new-password",
      );
    });

    test("서버 에러 처리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "에러 처리");

      // 이미 존재하는 이메일로 가입 시도
      await page.getByTestId("signup-input-email").fill("existing@example.com");
      await page.getByTestId("signup-input-password").fill("password123");

      // API 응답 모킹
      await page.route("**/api/auth/signup", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            errors: {
              email: "이미 사용 중인 이메일입니다.",
              general: "회원가입에 실패했습니다.",
            },
          }),
        });
      });

      await page.getByTestId("signup-submit").click();

      // 에러 메시지 표시 확인
      await expect(
        page.getByText("이미 사용 중인 이메일입니다."),
      ).toBeVisible();
      await expect(page.getByText("회원가입에 실패했습니다.")).toBeVisible();
    });

    test("폼 유효성 검증 에러 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

      // 짧은 비밀번호 입력
      await page.getByTestId("signup-input-email").fill("test@example.com");
      await page.getByTestId("signup-input-password").fill("123");

      // API 응답 모킹
      await page.route("**/api/auth/signup", async (route) => {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            errors: {
              password: "비밀번호는 최소 6자 이상이어야 합니다.",
            },
          }),
        });
      });

      await page.getByTestId("signup-submit").click();

      // 에러 메시지 및 스타일 확인
      await expect(
        page.getByText("비밀번호는 최소 6자 이상이어야 합니다."),
      ).toBeVisible();

      const passwordInput = page.getByTestId("signup-input-password");
      await expect(passwordInput).toHaveClass(/invalid|error/);
    });
  });

  test.describe("Special Cases", () => {
    test("초대 토큰과 함께 회원가입", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "초대 가입");

      // 초대 토큰이 포함된 URL로 접근
      await page.goto(
        "/signup?inviteToken=test-token&defaultEmail=invited@example.com",
      );

      // 이메일이 미리 채워져 있는지 확인
      const emailInput = page.getByTestId("signup-input-email");
      await expect(emailInput).toHaveValue("invited@example.com");

      // 초대 토큰이 숨겨진 필드에 있는지 확인
      const inviteTokenInput = page.locator("input[name='inviteToken']");
      await expect(inviteTokenInput).toHaveValue("test-token");
    });

    test("리턴 URL과 함께 로그인", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "리턴 URL");

      // 리턴 URL이 포함된 로그인 페이지
      await page.goto("/login?returnUrl=/dashboard");

      // 로그인 성공 시뮬레이션
      await page.getByTestId("login-input-id").fill("test@example.com");
      await page.getByTestId("login-input-pw").fill("password123");

      // API 응답 모킹
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      await page.getByTestId("login-submit").click();

      // 리턴 URL로 리디렉션되는지 확인
      await expect(page).toHaveURL("/dashboard");
    });

    test("토스트 메시지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "토스트 알림");

      // 잘못된 로그인 시도
      await page.goto("/login");
      await page.getByTestId("login-input-id").fill("wrong@example.com");
      await page.getByTestId("login-input-pw").fill("wrongpassword");

      // API 응답 모킹
      await page.route("**/api/auth/login", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: "이메일 또는 비밀번호가 올바르지 않습니다.",
          }),
        });
      });

      await page.getByTestId("login-submit").click();

      // 토스트 메시지 확인
      await expect(page.getByText("로그인 실패")).toBeVisible();
      await expect(
        page.getByText("이메일 또는 비밀번호가 올바르지 않습니다."),
      ).toBeVisible();
    });

    test("폼 리셋", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "폼 리셋");

      await page.goto("/login");

      // 폼에 데이터 입력
      await page.getByTestId("login-input-id").fill("test@example.com");
      await page.getByTestId("login-input-pw").fill("password123");

      // 회원가입 모드로 전환
      await page.getByRole("link", { name: "회원가입" }).click();

      // 다시 로그인 모드로 전환
      await page.getByRole("link", { name: "로그인" }).click();

      // 입력 필드가 유지되는지 확인 (일반적으로 리셋되지 않음)
      const emailValue = await page.getByTestId("login-input-id").inputValue();
      expect(emailValue).toBe("test@example.com");
    });
  });

  test.describe("Accessibility", () => {
    test("키보드 네비게이션", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "접근성");

      await page.goto("/login");

      // Tab 키로 네비게이션
      await page.keyboard.press("Tab"); // 이메일 필드
      await expect(page.getByTestId("login-input-id")).toBeFocused();

      await page.keyboard.press("Tab"); // 비밀번호 필드
      await expect(page.getByTestId("login-input-pw")).toBeFocused();

      await page.keyboard.press("Tab"); // 로그인 버튼
      await expect(page.getByTestId("login-submit")).toBeFocused();

      // Enter 키로 폼 제출
      await page.getByTestId("login-input-id").fill("test@example.com");
      await page.getByTestId("login-input-pw").fill("password123");
      await page.getByTestId("login-input-pw").press("Enter");

      // 폼이 제출되는지 확인 (버튼이 disabled 되거나 로딩 상태)
      await expect(page.getByTestId("login-submit")).toBeDisabled();
    });

    test("레이블과 에러 메시지", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "접근성 레이블");

      await page.goto("/login");

      // 레이블 확인
      await expect(page.getByLabel("이메일")).toBeVisible();
      await expect(page.getByLabel("비밀번호")).toBeVisible();

      // 에러 상태에서 aria 속성 확인
      await page.getByTestId("login-input-id").fill("invalid-email");
      await page.getByTestId("login-submit").click();

      const emailInput = page.getByTestId("login-input-id");
      await expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
  });
});
