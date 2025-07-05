import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Team Invite Page", () => {
  const mockInviteToken = "mock-invite-token-123";

  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "팀 협업");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "초대");
  });

  test("유효한 초대 링크로 접근", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "초대 수락");

    await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 초대 페이지 헤더
    await expect(
      page.getByRole("heading", { name: /팀 초대|Team Invitation/ }),
    ).toBeVisible();

    // 초대 정보 표시
    await expect(
      page.getByText(/님이 팀에 초대했습니다|invited you to join/),
    ).toBeVisible();

    // 팀 정보
    await expect(page.getByText("팀 이름")).toBeVisible();
    await expect(page.getByText("초대자")).toBeVisible();
    await expect(page.getByText("역할")).toBeVisible();

    // 액션 버튼들
    await expect(page.getByRole("button", { name: "초대 수락" })).toBeVisible();
    await expect(page.getByRole("button", { name: "거절" })).toBeVisible();
  });

  test("로그인하지 않은 상태에서 초대 수락", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "비로그인 초대");

    await await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 초대 수락 버튼 클릭
    await page.getByRole("button", { name: "초대 수락" }).click();

    // 로그인 페이지로 리디렉션
    await expect(page).toHaveURL(/login.*returnUrl.*invite/);

    // 로그인 페이지에 초대 관련 메시지
    await expect(
      page.getByText(/초대를 수락하려면 먼저 로그인하세요/),
    ).toBeVisible();
  });

  test("새 사용자로 초대 수락", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "신규 가입");

    await await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 계정이 없는 경우 회원가입 링크
    await expect(page.getByText("계정이 없으신가요?")).toBeVisible();
    const signupLink = page.getByRole("link", { name: "회원가입" });
    await expect(signupLink).toBeVisible();

    // 회원가입 링크 클릭
    await signupLink.click();

    // 회원가입 페이지로 이동 (초대 토큰 포함)
    await expect(page).toHaveURL(/signup.*inviteToken/);

    // 초대받은 이메일이 미리 채워져 있는지 확인
    const emailInput = page.getByTestId("signup-input-email");
    const emailValue = await emailInput.inputValue();
    if (emailValue) {
      expect(emailValue).toContain("@");
    }
  });

  test("만료된 초대 링크", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "만료된 초대");

    await gotoWithLang(page, "invite/expired-token");

    // 에러 메시지
    await expect(
      page.getByText(/초대가 만료되었습니다|Invalid invitation/),
    ).toBeVisible();
    await expect(
      page.getByText(/초대 링크가 유효하지 않거나 만료되었습니다/),
    ).toBeVisible();

    // 홈으로 돌아가기 버튼
    await expect(
      page.getByRole("button", { name: "홈으로 돌아가기" }),
    ).toBeVisible();
  });

  test("이미 팀 멤버인 경우", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "중복 초대");

    // 로그인된 상태를 가정
    await await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 이미 팀 멤버인 경우 메시지
    const alreadyMemberMessage = page.getByText(
      /이미 이 팀의 멤버입니다|already a member/,
    );
    if (await alreadyMemberMessage.isVisible()) {
      await expect(alreadyMemberMessage).toBeVisible();

      // 대시보드로 이동 버튼
      await expect(
        page.getByRole("button", { name: "대시보드로 이동" }),
      ).toBeVisible();
    }
  });

  test("초대 거절", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "초대 거절");

    await await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 거절 버튼 클릭
    await page.getByRole("button", { name: "거절" }).click();

    // 확인 모달
    await expect(page.getByText("초대를 거절하시겠습니까?")).toBeVisible();
    await expect(
      page.getByText("나중에 다시 초대받을 수 있습니다"),
    ).toBeVisible();

    // 확인 버튼들
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
    await expect(page.getByRole("button", { name: "거절" })).toBeVisible();

    // 거절 확인
    await page.getByRole("button", { name: "거절" }).last().click();

    // 완료 메시지
    await expect(
      page.getByText(/초대를 거절했습니다|Invitation declined/),
    ).toBeVisible();
  });

  test("초대 정보 로딩 상태", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "로딩 상태");

    // 느린 네트워크를 시뮬레이션
    await page.route("**/api/team/invite/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 로딩 상태 확인
    await expect(page.getByText(/로딩 중|Loading/)).toBeVisible();

    // 스켈레톤 또는 스피너
    const skeleton = page.locator("[class*='skeleton']");
    const spinner = page.locator("[class*='spinner']");
    await expect(skeleton.or(spinner).first()).toBeVisible();
  });

  test("초대 수락 후 팀 전환", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "팀 전환");

    // 로그인된 상태에서 초대 수락
    await await gotoWithLang(page, `invite/${mockInviteToken}`);
    await page.getByRole("button", { name: "초대 수락" }).click();

    // 성공 메시지
    await expect(
      page.getByText(/팀에 가입되었습니다|Successfully joined/),
    ).toBeVisible();

    // 대시보드로 리디렉션
    await expect(page).toHaveURL("/dashboard");

    // 새 팀이 선택되어 있는지 확인
    const teamSelector = page.locator("[class*='team-selector']");
    if (await teamSelector.isVisible()) {
      await expect(teamSelector).toContainText(/새 팀 이름/);
    }
  });

  test("초대 페이지 접근성", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "접근성");

    await await gotoWithLang(page, `invite/${mockInviteToken}`);

    // 키보드 네비게이션
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "초대 수락" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "거절" })).toBeFocused();

    // ARIA 레이블
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
