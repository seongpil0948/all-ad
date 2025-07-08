import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang, expectUrl } from "../utils/navigation";

test.describe("Login functionality", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "로그인");
    await gotoWithLang(page, "login");
    await page.waitForLoadState("networkidle");
    await expectUrl(page, "login");
  });

  test("로그인 페이지 표시 및 요소 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 로그인 폼 존재 확인
    await expect(page.getByTestId("login-form")).toBeVisible();

    // 이메일 입력 필드
    await expect(page.getByTestId("login-input-id")).toBeVisible();
    await expect(page.getByTestId("login-input-id")).toHaveAttribute(
      "type",
      "email",
    );

    // 비밀번호 입력 필드
    await expect(page.getByTestId("login-input-pw")).toBeVisible();
    await expect(page.getByTestId("login-input-pw")).toHaveAttribute(
      "type",
      "password",
    );

    // 로그인 버튼
    await expect(page.getByTestId("login-submit")).toBeVisible();
    await expect(page.getByTestId("login-submit")).toContainText("로그인");

    // 회원가입 링크
    await expect(page.getByText("계정이 없으신가요?")).toBeVisible();
    await expect(page.getByRole("link", { name: "회원가입" })).toBeVisible();

    // 비밀번호 찾기 링크
    await expect(
      page.getByRole("link", { name: "비밀번호를 잊으셨나요?" }),
    ).toBeVisible();
  });

  test("잘못된 이메일 형식 에러 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 잘못된 이메일 형식 입력
    await page.getByTestId("login-input-id").fill("invalid-email");
    await page.getByTestId("login-input-pw").fill("password123");
    await page.getByTestId("login-submit").click();

    // HTML5 validation 또는 서버 에러 메시지 확인
    // Input 컴포넌트는 type="email"이므로 브라우저 자체 검증이 작동함
    const emailInput = page.getByTestId("login-input-id");
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).toBeTruthy();
  });

  test("빈 필드 제출 시 에러 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 빈 상태로 제출
    await page.getByTestId("login-submit").click();

    // HTML5 required validation 확인
    const emailInput = page.getByTestId("login-input-id");
    const emailValidationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(emailValidationMessage).toBeTruthy();

    // 이메일 필드를 채우고 비밀번호 필드 검증
    await page.getByTestId("login-input-id").fill("test@example.com");
    await page.getByTestId("login-submit").click();

    const passwordInput = page.getByTestId("login-input-pw");
    const passwordValidationMessage = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(passwordValidationMessage).toBeTruthy();
  });

  test("잘못된 인증 정보로 로그인 시도", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "인증 실패");

    // 잘못된 인증 정보 입력
    await page.getByTestId("login-input-id").fill("wrong@example.com");
    await page.getByTestId("login-input-pw").fill("wrongpassword");
    await page.getByTestId("login-submit").click();

    // 에러 메시지 확인
    await expect(
      page.getByText("이메일 또는 비밀번호가 올바르지 않습니다"),
    ).toBeVisible();
  });

  test("회원가입 모드로 전환", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "폼 모드 전환");

    // 회원가입 링크 클릭 (AuthForm은 모드를 토글함)
    await page.getByRole("link", { name: "회원가입" }).click();

    // 회원가입 폼 요소 확인
    await expect(page.getByTestId("signup-input-email")).toBeVisible();
    await expect(page.getByTestId("signup-input-password")).toBeVisible();
    await expect(page.getByTestId("signup-submit")).toBeVisible();
    await expect(page.getByTestId("signup-submit")).toContainText("회원가입");

    // 로그인 링크가 표시되는지 확인 (모드가 전환되었음을 의미)
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
  });

  test("비밀번호 찾기 페이지로 이동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 비밀번호 찾기 링크 클릭
    await page.getByRole("link", { name: "비밀번호를 잊으셨나요?" }).click();
    await page.waitForLoadState("networkidle", { timeout: 30000 });

    // URL 확인 (언어 코드 포함)
    const pattern = await expectUrl(page, "forgot-password");
    await expect(page).toHaveURL(pattern);

    // 비밀번호 찾기 페이지 요소 확인
    await expect(
      page.getByRole("heading", { name: /비밀번호 재설정|Reset Password/ }),
    ).toBeVisible();
  });

  test("로고 클릭 시 홈페이지로 이동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 로고 찾기 - Navbar에 있는 "A.ll + Ad" 텍스트
    const logoLink = page
      .locator('a[href="/"]')
      .filter({ hasText: "A.ll + Ad" });
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await page.waitForLoadState("networkidle");

    // 홈페이지로 이동하고 intro 페이지로 리디렉션됨 확인
    const pattern = await expectUrl(page, "intro");
    await expect(page).toHaveURL(pattern);
  });
});
