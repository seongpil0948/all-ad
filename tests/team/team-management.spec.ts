import { test, expect, AnnotationType } from "../tester";

test.describe("Team Management", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "팀 관리");
    // 팀 관리 페이지로 이동
    await page.goto("/team");
  });

  test("팀 관리 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 레이아웃");

    // 페이지 제목
    await expect(page.getByRole("heading", { name: "팀 관리" })).toBeVisible();

    // 팀원 초대 버튼
    await expect(page.getByRole("button", { name: "팀원 초대" })).toBeVisible();

    // 팀원 목록 테이블
    await expect(
      page.locator('[data-testid="team-members-table"]'),
    ).toBeVisible();

    // 테이블 헤더
    const table = page.locator('[data-testid="team-members-table"]');
    await expect(table.locator("th").filter({ hasText: "이름" })).toBeVisible();
    await expect(
      table.locator("th").filter({ hasText: "이메일" }),
    ).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "역할" })).toBeVisible();
    await expect(
      table.locator("th").filter({ hasText: "가입일" }),
    ).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "액션" })).toBeVisible();
  });

  test("팀원 목록 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀원 목록");

    // 팀원 행 확인
    const memberRows = page.locator('[data-testid="team-member-row"]');
    const count = await memberRows.count();

    if (count > 0) {
      // 첫 번째 팀원 정보 확인
      const firstMember = memberRows.first();

      // 프로필 이미지 또는 아바타
      await expect(
        firstMember.locator('[data-testid="member-avatar"]'),
      ).toBeVisible();

      // 이름과 이메일
      await expect(
        firstMember.locator('[data-testid="member-name"]'),
      ).toBeVisible();
      await expect(
        firstMember.locator('[data-testid="member-email"]'),
      ).toBeVisible();

      // 역할 배지
      const roleBadge = firstMember.locator('[data-testid="member-role"]');
      await expect(roleBadge).toBeVisible();
      const role = await roleBadge.textContent();
      expect(["Master", "Team Mate", "Viewer"]).toContain(role);
    }
  });

  test("팀원 초대 모달", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀원 초대");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "초대 모달");

    // 팀원 초대 버튼 클릭
    await page.getByRole("button", { name: "팀원 초대" }).click();

    // 초대 모달 표시 확인
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "팀원 초대" }),
    ).toBeVisible();

    // 이메일 입력 필드
    await expect(page.getByLabel("이메일 주소")).toBeVisible();

    // 역할 선택 드롭다운
    await expect(page.getByLabel("역할")).toBeVisible();

    // 버튼들
    await expect(
      page.getByRole("button", { name: "초대 보내기" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
  });

  test("팀원 초대 유효성 검증", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀원 초대");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

    // 초대 모달 열기
    await page.getByRole("button", { name: "팀원 초대" }).click();

    // 빈 상태로 제출
    await page.getByRole("button", { name: "초대 보내기" }).click();

    // 에러 메시지 확인
    await expect(page.getByText("이메일을 입력해주세요")).toBeVisible();

    // 잘못된 이메일 형식
    await page.getByLabel("이메일 주소").fill("invalid-email");
    await page.getByRole("button", { name: "초대 보내기" }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText("올바른 이메일 주소를 입력해주세요"),
    ).toBeVisible();
  });

  test("팀원 초대 성공", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀원 초대");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "초대 성공");

    // 초대 모달 열기
    await page.getByRole("button", { name: "팀원 초대" }).click();

    // 유효한 정보 입력
    await page.getByLabel("이메일 주소").fill("newmember@example.com");
    await page.getByLabel("역할").selectOption("viewer");

    // 초대 보내기
    await page.getByRole("button", { name: "초대 보내기" }).click();

    // 성공 메시지 확인
    await expect(page.getByText("초대를 보냈습니다")).toBeVisible();

    // 모달 자동 닫힘
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // 대기 중인 초대 표시
    await expect(page.getByText("newmember@example.com")).toBeVisible();
    await expect(page.getByText("초대 대기 중")).toBeVisible();
  });

  test("팀원 역할 변경", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "역할 관리");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "역할 변경");

    // Master가 아닌 팀원 찾기
    const memberRow = page
      .locator('[data-testid="team-member-row"]')
      .filter({
        hasNot: page.locator('[data-testid="member-role"]:has-text("Master")'),
      })
      .first();

    if (await memberRow.isVisible()) {
      // 역할 변경 버튼 클릭
      await memberRow.locator('[data-testid="change-role-button"]').click();

      // 역할 선택 드롭다운 표시
      const roleSelect = memberRow.locator('[data-testid="role-select"]');
      await expect(roleSelect).toBeVisible();

      // 새 역할 선택
      await roleSelect.selectOption("team_mate");

      // 저장 버튼 클릭
      await memberRow.locator('[data-testid="save-role"]').click();

      // 성공 메시지 확인
      await expect(page.getByText("역할이 변경되었습니다")).toBeVisible();
    }
  });

  test("팀원 제거", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀원 관리");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "팀원 제거");

    // Master가 아닌 팀원 찾기
    const memberRow = page
      .locator('[data-testid="team-member-row"]')
      .filter({
        hasNot: page.locator('[data-testid="member-role"]:has-text("Master")'),
      })
      .first();

    if (await memberRow.isVisible()) {
      // 제거 버튼 클릭
      await memberRow.locator('[data-testid="remove-member-button"]').click();

      // 확인 다이얼로그 표시
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByText("정말로 이 팀원을 제거하시겠습니까?"),
      ).toBeVisible();

      // 취소 클릭
      await page.getByRole("button", { name: "취소" }).click();

      // 다이얼로그 닫힘 확인
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("Master 역할 제한사항", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "권한 관리");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Master 권한");

    // Master 팀원 찾기
    const masterRow = page
      .locator('[data-testid="team-member-row"]')
      .filter({
        has: page.locator('[data-testid="member-role"]:has-text("Master")'),
      })
      .first();

    if (await masterRow.isVisible()) {
      // Master는 역할 변경 버튼이 비활성화되어야 함
      const changeRoleButton = masterRow.locator(
        '[data-testid="change-role-button"]',
      );
      if (await changeRoleButton.isVisible()) {
        await expect(changeRoleButton).toBeDisabled();
      }

      // Master는 제거 버튼이 없어야 함
      await expect(
        masterRow.locator('[data-testid="remove-member-button"]'),
      ).not.toBeVisible();
    }
  });

  test("대기 중인 초대 취소", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "초대 관리");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "초대 취소");

    // 대기 중인 초대 찾기
    const pendingInvite = page
      .locator('[data-testid="pending-invite"]')
      .first();

    if (await pendingInvite.isVisible()) {
      // 초대 취소 버튼 클릭
      await pendingInvite.locator('[data-testid="cancel-invite"]').click();

      // 확인 다이얼로그
      await expect(page.getByText("초대를 취소하시겠습니까?")).toBeVisible();

      // 확인 클릭
      await page.getByRole("button", { name: "확인" }).click();

      // 성공 메시지
      await expect(page.getByText("초대가 취소되었습니다")).toBeVisible();
    }
  });

  test("팀원 검색 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀원 검색");

    // 검색 입력 필드
    const searchInput = page.locator('[data-testid="search-members"]');

    if (await searchInput.isVisible()) {
      // 검색어 입력
      await searchInput.fill("test");

      // 필터링된 결과 확인
      const memberRows = page.locator('[data-testid="team-member-row"]');
      const count = await memberRows.count();

      for (let i = 0; i < count; i++) {
        const memberText = await memberRows.nth(i).textContent();
        expect(memberText?.toLowerCase()).toContain("test");
      }

      // 검색 초기화
      await searchInput.clear();
    }
  });

  test("팀 정보 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "팀 정보");

    // 팀 정보 카드
    const teamInfoCard = page.locator('[data-testid="team-info-card"]');

    if (await teamInfoCard.isVisible()) {
      // 팀 이름
      await expect(
        teamInfoCard.locator('[data-testid="team-name"]'),
      ).toBeVisible();

      // 팀원 수
      await expect(
        teamInfoCard.locator('[data-testid="member-count"]'),
      ).toBeVisible();

      // 생성일
      await expect(
        teamInfoCard.locator('[data-testid="created-date"]'),
      ).toBeVisible();

      // 요금제 정보 (있는 경우)
      const planInfo = teamInfoCard.locator('[data-testid="plan-info"]');
      if (await planInfo.isVisible()) {
        await expect(planInfo).toContainText(/Free|Starter|Plus|Pro/);
      }
    }
  });
});
