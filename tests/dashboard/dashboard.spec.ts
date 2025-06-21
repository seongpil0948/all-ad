import { test, expect, AnnotationType } from "../tester";

test.describe("Dashboard functionality", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "대시보드");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "메인 대시보드");
    // 인증된 상태로 대시보드 접근
    await page.goto("/dashboard");
  });

  test("대시보드 페이지 레이아웃 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "레이아웃");

    // 페이지 제목
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

    // 사용자 정보 표시
    await expect(page.getByText("로그아웃")).toBeVisible();

    // 네비게이션 메뉴 확인
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("link", { name: "대시보드" })).toBeVisible();
    await expect(page.getByRole("link", { name: "통합 관리" })).toBeVisible();
    await expect(page.getByRole("link", { name: "분석" })).toBeVisible();
    await expect(page.getByRole("link", { name: "팀 관리" })).toBeVisible();
    await expect(page.getByRole("link", { name: "설정" })).toBeVisible();
  });

  test("플랫폼별 캠페인 통계 카드 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "통계 카드");

    // 플랫폼별 통계 카드 존재 확인
    const platformCards = [
      "Google Ads",
      "Facebook Ads",
      "Naver Ads",
      "Kakao Ads",
      "Coupang Ads",
    ];

    for (const platform of platformCards) {
      const card = page.locator(`[data-platform="${platform}"]`);
      if (await card.isVisible()) {
        // 캠페인 수
        await expect(card.locator('[data-stat="campaigns"]')).toBeVisible();
        // 총 예산
        await expect(card.locator('[data-stat="budget"]')).toBeVisible();
        // 총 지출
        await expect(card.locator('[data-stat="spend"]')).toBeVisible();
      }
    }
  });

  test("캠페인 테이블 표시 및 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "캠페인 테이블");

    // 캠페인 테이블 존재 확인
    const table = page.locator('[data-testid="campaign-table"]');
    await expect(table).toBeVisible();

    // 테이블 헤더 확인
    await expect(
      table.locator("th").filter({ hasText: "캠페인명" }),
    ).toBeVisible();
    await expect(
      table.locator("th").filter({ hasText: "플랫폼" }),
    ).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "상태" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "예산" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "지출" })).toBeVisible();
    await expect(table.locator("th").filter({ hasText: "액션" })).toBeVisible();
  });

  test("캠페인 상태 토글 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "캠페인 제어");

    // 첫 번째 캠페인의 상태 토글 스위치 찾기
    const firstCampaignRow = page
      .locator('[data-testid="campaign-row"]')
      .first();
    const statusToggle = firstCampaignRow.locator(
      '[data-testid="status-toggle"]',
    );

    if (await statusToggle.isVisible()) {
      // 현재 상태 확인
      const initialStatus = await statusToggle.getAttribute("aria-checked");

      // 상태 토글
      await statusToggle.click();

      // 상태 변경 확인
      await expect(statusToggle).toHaveAttribute(
        "aria-checked",
        initialStatus === "true" ? "false" : "true",
      );

      // 성공 토스트 메시지 확인
      await expect(
        page.getByText(/캠페인 상태가 변경되었습니다/),
      ).toBeVisible();
    }
  });

  test("캠페인 예산 편집 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "예산 편집");

    // 첫 번째 캠페인의 예산 편집 버튼 찾기
    const firstCampaignRow = page
      .locator('[data-testid="campaign-row"]')
      .first();
    const editBudgetButton = firstCampaignRow.locator(
      '[data-testid="edit-budget"]',
    );

    if (await editBudgetButton.isVisible()) {
      // 예산 편집 버튼 클릭
      await editBudgetButton.click();

      // 예산 입력 필드 표시 확인
      const budgetInput = firstCampaignRow.locator(
        '[data-testid="budget-input"]',
      );
      await expect(budgetInput).toBeVisible();

      // 새 예산 입력
      await budgetInput.fill("1000000");

      // 저장 버튼 클릭
      await firstCampaignRow.locator('[data-testid="save-budget"]').click();

      // 성공 메시지 확인
      await expect(page.getByText(/예산이 업데이트되었습니다/)).toBeVisible();
    }
  });

  test("플랫폼 필터 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "필터링");

    // 플랫폼 필터 드롭다운
    const platformFilter = page.locator('[data-testid="platform-filter"]');

    if (await platformFilter.isVisible()) {
      // 필터 드롭다운 클릭
      await platformFilter.click();

      // Google Ads 선택
      await page.getByRole("option", { name: "Google Ads" }).click();

      // 필터링된 결과 확인
      const campaignRows = page.locator('[data-testid="campaign-row"]');
      const count = await campaignRows.count();

      for (let i = 0; i < count; i++) {
        const platform = await campaignRows
          .nth(i)
          .locator('[data-column="platform"]')
          .textContent();
        expect(platform).toBe("Google Ads");
      }
    }
  });

  test("데이터 동기화 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "데이터 동기화");

    // 동기화 버튼 찾기
    const syncButton = page.locator('[data-testid="sync-button"]');

    if (await syncButton.isVisible()) {
      // 동기화 버튼 클릭
      await syncButton.click();

      // 로딩 상태 확인
      await expect(page.getByText(/동기화 중/)).toBeVisible();

      // 완료 메시지 확인 (타임아웃 증가)
      await expect(page.getByText(/동기화가 완료되었습니다/)).toBeVisible({
        timeout: 30000,
      });
    }
  });

  test("빈 상태 메시지 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "빈 상태");

    // 캠페인이 없는 경우 빈 상태 메시지 확인
    const emptyState = page.locator('[data-testid="empty-state"]');

    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText("캠페인이 없습니다");
      await expect(
        page.getByRole("button", { name: "플랫폼 연동하기" }),
      ).toBeVisible();
    }
  });

  test("날짜 범위 필터", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "날짜 필터");

    // 날짜 범위 선택기
    const dateRangePicker = page.locator('[data-testid="date-range-picker"]');

    if (await dateRangePicker.isVisible()) {
      // 날짜 범위 선택기 클릭
      await dateRangePicker.click();

      // 프리셋 옵션 확인
      await expect(page.getByRole("option", { name: "오늘" })).toBeVisible();
      await expect(page.getByRole("option", { name: "어제" })).toBeVisible();
      await expect(
        page.getByRole("option", { name: "최근 7일" }),
      ).toBeVisible();
      await expect(
        page.getByRole("option", { name: "최근 30일" }),
      ).toBeVisible();

      // 최근 7일 선택
      await page.getByRole("option", { name: "최근 7일" }).click();

      // 데이터 업데이트 확인
      await expect(page.getByText(/데이터를 불러오는 중/)).toBeVisible();
    }
  });
});
