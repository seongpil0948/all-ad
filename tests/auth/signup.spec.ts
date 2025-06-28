import { test, expect, AnnotationType } from "../tester";

test.describe("Signup functionality", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "회원가입");
    await page.goto("/signup");
  });

  test("회원가입 페이지 표시 및 요소 확인", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 제목 확인
    await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();

    // 이메일 입력 필드
    await expect(page.getByPlaceholder("your@email.com")).toBeVisible();

    // 비밀번호 입력 필드
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();

    // 이름 입력 필드
    await expect(page.getByPlaceholder("홍길동")).toBeVisible();

    // 회원가입 버튼
    await expect(page.getByRole("button", { name: "회원가입" })).toBeVisible();

    // 로그인 링크
    await expect(page.getByText("이미 계정이 있으신가요?")).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인" })).toBeVisible();
  });

  test("유효성 검증 - 빈 필드", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 빈 상태로 제출
    await page.getByRole("button", { name: "회원가입" }).click();

    // 에러 메시지 확인 (실제 메시지는 구현에 따라 다를 수 있음)
    await expect(page.getByText("이메일을 입력해주세요")).toBeVisible();
    await expect(page.getByText("비밀번호를 입력해주세요")).toBeVisible();
    await expect(page.getByText("이름을 입력해주세요")).toBeVisible();
  });

  test("유효성 검증 - 잘못된 이메일 형식", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 잘못된 이메일 형식 입력
    await page.getByPlaceholder("your@email.com").fill("invalid-email");
    await page.getByPlaceholder("••••••••").fill("password123");
    await page.getByPlaceholder("홍길동").fill("테스트 사용자");
    await page.getByRole("button", { name: "회원가입" }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText("올바른 이메일 주소를 입력해주세요"),
    ).toBeVisible();
  });

  test("유효성 검증 - 짧은 비밀번호", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 짧은 비밀번호 입력
    await page.getByPlaceholder("your@email.com").fill("test@example.com");
    await page.getByPlaceholder("••••••••").fill("123");
    await page.getByPlaceholder("홍길동").fill("테스트 사용자");
    await page.getByRole("button", { name: "회원가입" }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText("비밀번호는 최소 6자 이상이어야 합니다"),
    ).toBeVisible();
  });

  test("이미 존재하는 이메일로 가입 시도", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "중복 체크");

    // 기존 사용자 이메일로 가입 시도
    await page.getByPlaceholder("your@email.com").fill("existing@example.com");
    await page.getByPlaceholder("••••••••").fill("password123");
    await page.getByPlaceholder("홍길동").fill("테스트 사용자");
    await page.getByRole("button", { name: "회원가입" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("이미 사용 중인 이메일입니다")).toBeVisible();
  });

  test("로그인 페이지로 이동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 로그인 링크 클릭
    await page.getByRole("link", { name: "로그인" }).click();

    // URL 확인
    await expect(page).toHaveURL("/login");

    // 로그인 페이지 요소 확인
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("약관 동의 체크박스 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "약관 동의");

    // 약관 동의 체크박스가 있는 경우
    const termsCheckbox = page.getByRole("checkbox", { name: /이용약관/ });
    const privacyCheckbox = page.getByRole("checkbox", { name: /개인정보/ });

    if (await termsCheckbox.isVisible()) {
      // 약관 동의 없이 가입 시도
      await page.getByPlaceholder("your@email.com").fill("test@example.com");
      await page.getByPlaceholder("••••••••").fill("password123");
      await page.getByPlaceholder("홍길동").fill("테스트 사용자");
      await page.getByRole("button", { name: "회원가입" }).click();

      // 에러 메시지 확인
      await expect(page.getByText("약관에 동의해주세요")).toBeVisible();

      // 약관 동의 후 다시 시도
      await termsCheckbox.check();
      await privacyCheckbox.check();
    }
  });
});
