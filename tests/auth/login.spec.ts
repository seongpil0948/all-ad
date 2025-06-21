import { test, expect, AnnotationType } from "../tester";

test.describe("Login functionality", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "로그인");
    await page.goto("/login");
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

    // 에러 메시지 확인
    await expect(
      page.getByText("올바른 이메일 주소를 입력해주세요"),
    ).toBeVisible();
  });

  test("빈 필드 제출 시 에러 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 빈 상태로 제출
    await page.getByTestId("login-submit").click();

    // 에러 메시지 확인
    await expect(page.getByText("이메일을 입력해주세요")).toBeVisible();
    await expect(page.getByText("비밀번호를 입력해주세요")).toBeVisible();
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

  test("회원가입 페이지로 이동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 회원가입 링크 클릭
    await page.getByRole("link", { name: "회원가입" }).click();

    // URL 확인
    await expect(page).toHaveURL("/signup");

    // 회원가입 페이지 요소 확인
    await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
  });

  test("비밀번호 찾기 페이지로 이동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 비밀번호 찾기 링크 클릭
    await page.getByRole("link", { name: "비밀번호를 잊으셨나요?" }).click();

    // URL 확인
    await expect(page).toHaveURL("/forgot-password");

    // 비밀번호 찾기 페이지 요소 확인
    await expect(
      page.getByRole("heading", { name: "비밀번호 재설정" }),
    ).toBeVisible();
  });

  test("로고 클릭 시 홈페이지로 이동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 로고 클릭
    await page.getByRole("link", { name: "All-AD" }).click();

    // 홈페이지로 이동 확인
    await expect(page).toHaveURL("/");
  });
});
