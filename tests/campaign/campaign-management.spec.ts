import { test, expect, AnnotationType } from "../tester";

test.describe("Campaign Management", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "캠페인 관리");
    // 통합 관리 페이지로 이동
    await page.goto("/integrated");
  });

  test("통합 캠페인 관리 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 레이아웃");

    // 페이지 제목
    await expect(
      page.getByRole("heading", { name: "통합 캠페인 관리" }),
    ).toBeVisible();

    // 플랫폼 탭
    const platformTabs = [
      "전체",
      "Google Ads",
      "Facebook Ads",
      "Naver Ads",
      "Kakao Ads",
      "Coupang Ads",
    ];
    for (const tab of platformTabs) {
      await expect(page.getByRole("tab", { name: tab })).toBeVisible();
    }

    // 필터 및 검색 영역
    await expect(page.locator('[data-testid="campaign-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="date-range-filter"]'),
    ).toBeVisible();
  });

  test("캠페인 목록 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "캠페인 목록");

    // 캠페인 테이블
    const campaignTable = page.locator('[data-testid="campaign-table"]');
    await expect(campaignTable).toBeVisible();

    // 테이블 헤더
    await expect(
      campaignTable.locator("th").filter({ hasText: "캠페인명" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "플랫폼" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "상태" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "일일 예산" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "오늘 지출" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "노출수" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "클릭수" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "CTR" }),
    ).toBeVisible();
    await expect(
      campaignTable.locator("th").filter({ hasText: "CPC" }),
    ).toBeVisible();
  });

  test("캠페인 상태 일괄 변경", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "일괄 작업");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "상태 변경");

    // 캠페인 선택
    const campaignRows = page.locator('[data-testid="campaign-row"]');
    const count = await campaignRows.count();

    if (count >= 2) {
      // 2개 이상의 캠페인 선택
      await campaignRows
        .nth(0)
        .locator('[data-testid="campaign-checkbox"]')
        .check();
      await campaignRows
        .nth(1)
        .locator('[data-testid="campaign-checkbox"]')
        .check();

      // 일괄 작업 버튼 표시 확인
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

      // 일괄 일시정지 버튼 클릭
      await page.locator('[data-testid="bulk-pause"]').click();

      // 확인 다이얼로그
      await expect(
        page.getByText("선택한 2개의 캠페인을 일시정지하시겠습니까?"),
      ).toBeVisible();

      // 확인 클릭
      await page.getByRole("button", { name: "확인" }).click();

      // 성공 메시지
      await expect(
        page.getByText("캠페인 상태가 변경되었습니다"),
      ).toBeVisible();
    }
  });

  test("캠페인 검색 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "검색 및 필터");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "캠페인 검색");

    // 검색 입력
    const searchInput = page.locator('[data-testid="campaign-search"]');
    await searchInput.fill("summer");

    // 검색 버튼 클릭 또는 Enter
    await searchInput.press("Enter");

    // 검색 결과 확인
    const campaignRows = page.locator('[data-testid="campaign-row"]');
    const count = await campaignRows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const campaignName = await campaignRows
          .nth(i)
          .locator('[data-testid="campaign-name"]')
          .textContent();
        expect(campaignName?.toLowerCase()).toContain("summer");
      }
    } else {
      // 검색 결과 없음 메시지
      await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
    }
  });

  test("상태 필터링", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "검색 및 필터");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "상태 필터");

    // 상태 필터 드롭다운
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await statusFilter.click();

    // 활성 캠페인만 선택
    await page.getByRole("option", { name: "활성" }).click();

    // 필터링된 결과 확인
    const campaignRows = page.locator('[data-testid="campaign-row"]');
    const count = await campaignRows.count();

    for (let i = 0; i < count; i++) {
      const status = await campaignRows
        .nth(i)
        .locator('[data-testid="campaign-status"]')
        .textContent();
      expect(status).toBe("활성");
    }
  });

  test("플랫폼별 탭 전환", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "플랫폼 필터");

    // Google Ads 탭 클릭
    await page.getByRole("tab", { name: "Google Ads" }).click();

    // Google Ads 캠페인만 표시되는지 확인
    const campaignRows = page.locator('[data-testid="campaign-row"]');
    const count = await campaignRows.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const platform = await campaignRows
          .nth(i)
          .locator('[data-testid="campaign-platform"]')
          .textContent();
        expect(platform).toBe("Google Ads");
      }
    }

    // 플랫폼별 특수 기능 확인
    await expect(
      page.locator('[data-testid="google-ads-features"]'),
    ).toBeVisible();
  });

  test("캠페인 상세 정보 보기", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "캠페인 상세");

    // 첫 번째 캠페인 클릭
    const firstCampaign = page.locator('[data-testid="campaign-row"]').first();

    if (await firstCampaign.isVisible()) {
      await firstCampaign.locator('[data-testid="campaign-name"]').click();

      // 상세 정보 모달 또는 패널 표시
      await expect(
        page.locator('[data-testid="campaign-details"]'),
      ).toBeVisible();

      // 상세 정보 확인
      await expect(page.getByText("캠페인 정보")).toBeVisible();
      await expect(page.getByText("성과 지표")).toBeVisible();
      await expect(page.getByText("타겟팅 설정")).toBeVisible();

      // 닫기 버튼
      await page.locator('[data-testid="close-details"]').click();
      await expect(
        page.locator('[data-testid="campaign-details"]'),
      ).not.toBeVisible();
    }
  });

  test("예산 일괄 편집", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "일괄 작업");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "예산 편집");

    // 여러 캠페인 선택
    const campaignRows = page.locator('[data-testid="campaign-row"]');
    const count = await campaignRows.count();

    if (count >= 2) {
      await campaignRows
        .nth(0)
        .locator('[data-testid="campaign-checkbox"]')
        .check();
      await campaignRows
        .nth(1)
        .locator('[data-testid="campaign-checkbox"]')
        .check();

      // 예산 편집 버튼 클릭
      await page.locator('[data-testid="bulk-edit-budget"]').click();

      // 예산 편집 모달
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("예산 일괄 편집")).toBeVisible();

      // 예산 변경 옵션
      await expect(page.getByLabel("고정 금액으로 설정")).toBeVisible();
      await expect(page.getByLabel("비율로 조정")).toBeVisible();

      // 고정 금액 선택
      await page.getByLabel("고정 금액으로 설정").check();
      await page.getByLabel("새 예산").fill("500000");

      // 적용 버튼 클릭
      await page.getByRole("button", { name: "적용" }).click();

      // 성공 메시지
      await expect(page.getByText("예산이 업데이트되었습니다")).toBeVisible();
    }
  });

  test("Coupang 수동 캠페인 관리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Coupang 캠페인");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "수동 관리");

    // Coupang Ads 탭 클릭
    await page.getByRole("tab", { name: "Coupang Ads" }).click();

    // 수동 캠페인 추가 버튼
    await expect(
      page.getByRole("button", { name: "캠페인 추가" }),
    ).toBeVisible();

    // 캠페인 추가 버튼 클릭
    await page.getByRole("button", { name: "캠페인 추가" }).click();

    // 수동 캠페인 추가 모달
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Coupang 캠페인 추가")).toBeVisible();

    // 필수 입력 필드
    await expect(page.getByLabel("캠페인명")).toBeVisible();
    await expect(page.getByLabel("일일 예산")).toBeVisible();
    await expect(page.getByLabel("시작일")).toBeVisible();
    await expect(page.getByLabel("종료일")).toBeVisible();
  });

  test("성과 데이터 수동 업데이트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Coupang 캠페인");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "성과 업데이트");

    // Coupang Ads 탭에서
    await page.getByRole("tab", { name: "Coupang Ads" }).click();

    // 기존 캠페인의 성과 업데이트 버튼
    const coupangCampaign = page
      .locator('[data-testid="campaign-row"]')
      .first();

    if (await coupangCampaign.isVisible()) {
      await coupangCampaign.locator('[data-testid="update-metrics"]').click();

      // 성과 업데이트 모달
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("성과 데이터 업데이트")).toBeVisible();

      // 성과 입력 필드
      await expect(page.getByLabel("노출수")).toBeVisible();
      await expect(page.getByLabel("클릭수")).toBeVisible();
      await expect(page.getByLabel("지출액")).toBeVisible();
      await expect(page.getByLabel("전환수")).toBeVisible();
      await expect(page.getByLabel("매출액")).toBeVisible();
    }
  });

  test("캠페인 데이터 내보내기", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "데이터 내보내기");

    // 내보내기 버튼
    const exportButton = page.locator('[data-testid="export-button"]');

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // 내보내기 옵션 메뉴
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Excel 다운로드" }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "CSV 다운로드" }),
      ).toBeVisible();

      // Excel 다운로드 선택
      await page.getByRole("menuitem", { name: "Excel 다운로드" }).click();

      // 다운로드 시작 메시지
      await expect(
        page.getByText("다운로드를 준비하고 있습니다"),
      ).toBeVisible();
    }
  });

  test("캠페인 정렬 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "정렬");

    // 예산 컬럼 헤더 클릭하여 정렬
    const budgetHeader = page.locator("th").filter({ hasText: "일일 예산" });
    await budgetHeader.click();

    // 정렬 아이콘 변경 확인
    await expect(
      budgetHeader.locator('[data-testid="sort-icon"]'),
    ).toBeVisible();

    // 다시 클릭하여 역순 정렬
    await budgetHeader.click();

    // 정렬 방향 변경 확인
    await expect(
      budgetHeader.locator('[data-testid="sort-icon-desc"]'),
    ).toBeVisible();
  });
});
