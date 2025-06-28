import { test, expect, AnnotationType } from "../tester";

test.describe("Reset Password functionality", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "비밀번호 재설정");
    // 실제 재설정 페이지는 이메일 링크를 통해서만 접근 가능하므로
    // 테스트를 위해 직접 URL로 이동
    await page.goto("/reset-password");
  });

  test("비밀번호 재설정 페이지 표시 및 요소 확인", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 페이지 제목 확인
    await expect(
      page.getByRole("heading", { name: "비밀번호 재설정" }),
    ).toBeVisible();

    // 설명 텍스트 확인
    await expect(
      page.getByText("새로운 비밀번호를 입력해주세요"),
    ).toBeVisible();

    // 비밀번호 입력 필드
    const passwordInput = page.getByPlaceholder("새 비밀번호");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");

    // 비밀번호 확인 입력 필드
    const confirmPasswordInput = page.getByPlaceholder("비밀번호 확인");
    await expect(confirmPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toHaveAttribute("type", "password");

    // 재설정 버튼
    await expect(
      page.getByRole("button", { name: "비밀번호 재설정" }),
    ).toBeVisible();

    // 로그인 페이지로 돌아가기 링크
    await expect(
      page.getByRole("link", { name: "로그인 페이지로 돌아가기" }),
    ).toBeVisible();
  });

  test("비밀번호 유효성 검증 - 짧은 비밀번호", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 짧은 비밀번호 입력
    await page.getByPlaceholder("새 비밀번호").fill("123");
    await page.getByPlaceholder("비밀번호 확인").fill("123");
    await page.getByRole("button", { name: "비밀번호 재설정" }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText("비밀번호는 최소 6자 이상이어야 합니다"),
    ).toBeVisible();
  });

  test("비밀번호 유효성 검증 - 비밀번호 불일치", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 서로 다른 비밀번호 입력
    await page.getByPlaceholder("새 비밀번호").fill("password123");
    await page.getByPlaceholder("비밀번호 확인").fill("password456");
    await page.getByRole("button", { name: "비밀번호 재설정" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("비밀번호가 일치하지 않습니다")).toBeVisible();
  });

  test("빈 필드 제출 시 에러 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 빈 상태로 제출
    await page.getByRole("button", { name: "비밀번호 재설정" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("비밀번호를 입력해주세요")).toBeVisible();
  });

  test("로그인 페이지로 돌아가기", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 로그인 페이지로 돌아가기 링크 클릭
    await page.getByRole("link", { name: "로그인 페이지로 돌아가기" }).click();

    // URL 확인
    await expect(page).toHaveURL("/login");

    // 로그인 페이지 요소 확인
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("유효하지 않은 토큰으로 접근", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "에러 처리");

    // 잘못된 토큰으로 접근 시도
    await page.goto("/reset-password?token=invalid-token");

    // 에러 메시지 또는 리디렉션 확인
    await expect(
      page.getByText(/유효하지 않은 요청|만료된 링크/),
    ).toBeVisible();
  });
});
