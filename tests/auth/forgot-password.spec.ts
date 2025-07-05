import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Forgot Password functionality", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "비밀번호 재설정");
    await gotoWithLang(page, "forgot-password");
  });

  test("비밀번호 재설정 페이지 표시 및 요소 확인", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 제목 확인
    await expect(
      page.getByRole("heading", { name: "비밀번호 재설정" }),
    ).toBeVisible();

    // 설명 텍스트 확인
    await expect(
      page.getByText(
        "이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다",
      ),
    ).toBeVisible();

    // 이메일 입력 필드
    await expect(page.getByPlaceholder("your@email.com")).toBeVisible();

    // 재설정 링크 전송 버튼
    await expect(
      page.getByRole("button", { name: "재설정 링크 전송" }),
    ).toBeVisible();

    // 로그인 페이지로 돌아가기 링크
    await expect(
      page.getByRole("link", { name: "로그인으로 돌아가기" }),
    ).toBeVisible();
  });

  test("유효성 검증 - 빈 이메일", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 빈 상태로 제출
    await page.getByRole("button", { name: "재설정 링크 전송" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("이메일을 입력해주세요")).toBeVisible();
  });

  test("유효성 검증 - 잘못된 이메일 형식", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 잘못된 이메일 형식 입력
    await page.getByPlaceholder("your@email.com").fill("invalid-email");
    await page.getByRole("button", { name: "재설정 링크 전송" }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText("올바른 이메일 주소를 입력해주세요"),
    ).toBeVisible();
  });

  test("존재하지 않는 이메일로 재설정 시도", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "사용자 확인");

    // 존재하지 않는 이메일 입력
    await page
      .getByPlaceholder("your@email.com")
      .fill("nonexistent@example.com");
    await page.getByRole("button", { name: "재설정 링크 전송" }).click();

    // 보안상 이유로 성공 메시지가 표시될 수도 있음
    // 또는 에러 메시지가 표시될 수도 있음
    await expect(
      page.getByText(/이메일을 확인해주세요|등록되지 않은 이메일입니다/),
    ).toBeVisible();
  });

  test("성공적인 재설정 링크 전송", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "재설정 요청 성공");

    // 유효한 이메일 입력
    await page.getByPlaceholder("your@email.com").fill("valid@example.com");
    await page.getByRole("button", { name: "재설정 링크 전송" }).click();

    // 성공 메시지 확인
    await expect(page.getByText("이메일을 확인해주세요")).toBeVisible();
    await expect(
      page.getByText("비밀번호 재설정 링크를 전송했습니다"),
    ).toBeVisible();
  });

  test("로그인 페이지로 돌아가기", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 네비게이션");

    // 로그인으로 돌아가기 링크 클릭
    await page.getByRole("link", { name: "로그인으로 돌아가기" }).click();

    // URL 확인
    await expect(page).toHaveURL("/login");

    // 로그인 페이지 요소 확인
    await expect(page.getByTestId("login-form")).toBeVisible();
  });

  test("재전송 제한 시간 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "재전송 제한");

    // 첫 번째 전송
    await page.getByPlaceholder("your@email.com").fill("valid@example.com");
    await page.getByRole("button", { name: "재설정 링크 전송" }).click();

    // 성공 메시지 확인
    await expect(page.getByText("이메일을 확인해주세요")).toBeVisible();

    // 즉시 재전송 시도
    await page.getByPlaceholder("your@email.com").fill("valid@example.com");
    await page.getByRole("button", { name: "재설정 링크 전송" }).click();

    // 재전송 제한 메시지 확인
    await expect(
      page.getByText(/잠시 후에 다시 시도해주세요|너무 많은 요청/),
    ).toBeVisible();
  });
});
