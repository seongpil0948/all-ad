import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Analytics Page", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "분석");
    // 분석 페이지로 이동
    await gotoWithLang(page, "analytics");
    await page.waitForLoadState("networkidle");
  });

  test.skip("분석 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    // Skip: Analytics page not implemented yet
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 레이아웃");

    // 날짜 범위 선택기
    await expect(
      page.locator('[data-testid="date-range-picker"]'),
    ).toBeVisible();

    // 차트 섹션들
    await expect(
      page.locator('[data-testid="performance-overview"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="platform-comparison"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="trend-analysis"]')).toBeVisible();
  });

  test.skip("성과 개요 차트", async ({ page, pushAnnotation }) => {
    // Skip: Analytics page not implemented yet
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "성과 개요");

    const performanceSection = page.locator(
      '[data-testid="performance-overview"]',
    );

    // 주요 지표 카드
    const metrics = [
      "총 지출",
      "총 클릭",
      "총 노출",
      "평균 CPC",
      "평균 CTR",
      "ROAS",
    ];

    for (const metric of metrics) {
      await expect(
        performanceSection.locator(`[data-metric="${metric}"]`),
      ).toBeVisible();
    }

    // 차트 타입 전환
    const chartTypeButtons = performanceSection.locator(
      '[data-testid="chart-type-selector"] button',
    );
    const chartTypes = await chartTypeButtons.count();

    if (chartTypes > 0) {
      // 라인 차트
      await chartTypeButtons.filter({ hasText: "라인" }).click();
      await expect(
        performanceSection.locator('[data-chart-type="line"]'),
      ).toBeVisible();

      // 바 차트
      await chartTypeButtons.filter({ hasText: "바" }).click();
      await expect(
        performanceSection.locator('[data-chart-type="bar"]'),
      ).toBeVisible();
    }
  });

  test.skip("플랫폼별 비교 분석", async ({ page, pushAnnotation }) => {
    // Skip: Analytics page not implemented yet
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "플랫폼 비교");

    const comparisonSection = page.locator(
      '[data-testid="platform-comparison"]',
    );

    // 플랫폼 선택 체크박스
    const platforms = ["Google Ads", "Facebook Ads", "Naver Ads", "Kakao Ads"];

    for (const platform of platforms) {
      const checkbox = comparisonSection.locator(`input[value="${platform}"]`);
      if (await checkbox.isVisible()) {
        await checkbox.check();
      }
    }

    // 비교 지표 선택
    const metricSelect = comparisonSection.locator(
      '[data-testid="comparison-metric"]',
    );
    if (await metricSelect.isVisible()) {
      await metricSelect.selectOption("spend");
      await metricSelect.selectOption("clicks");
      await metricSelect.selectOption("impressions");
    }

    // 차트 업데이트 확인
    await expect(
      comparisonSection.locator('[data-testid="comparison-chart"]'),
    ).toBeVisible();
  });

  test.skip("트렌드 분석", async ({ page, pushAnnotation }) => {
    // Skip: Analytics page not implemented yet
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "트렌드 분석");

    const trendSection = page.locator('[data-testid="trend-analysis"]');

    // 기간 선택
    const periodSelect = trendSection.locator('[data-testid="trend-period"]');
    if (await periodSelect.isVisible()) {
      await periodSelect.selectOption("daily");
      await periodSelect.selectOption("weekly");
      await periodSelect.selectOption("monthly");
    }

    // 트렌드 지표
    await expect(
      trendSection.locator('[data-testid="trend-chart"]'),
    ).toBeVisible();

    // 증감률 표시
    await expect(
      trendSection.locator('[data-testid="trend-percentage"]'),
    ).toBeVisible();
  });

  test.skip("캠페인별 성과 분석", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "캠페인 분석");

    // 캠페인 성과 테이블
    const campaignTable = page.locator(
      '[data-testid="campaign-performance-table"]',
    );

    if (await campaignTable.isVisible()) {
      // 테이블 헤더
      await expect(
        campaignTable.locator("th").filter({ hasText: "캠페인" }),
      ).toBeVisible();
      await expect(
        campaignTable.locator("th").filter({ hasText: "플랫폼" }),
      ).toBeVisible();
      await expect(
        campaignTable.locator("th").filter({ hasText: "지출" }),
      ).toBeVisible();
      await expect(
        campaignTable.locator("th").filter({ hasText: "클릭" }),
      ).toBeVisible();
      await expect(
        campaignTable.locator("th").filter({ hasText: "CTR" }),
      ).toBeVisible();
      await expect(
        campaignTable.locator("th").filter({ hasText: "CPC" }),
      ).toBeVisible();

      // 정렬 기능
      await campaignTable.locator("th").filter({ hasText: "지출" }).click();
      await expect(
        campaignTable.locator('[data-sort="spend-desc"]'),
      ).toBeVisible();
    }
  });

  test.skip("커스텀 날짜 범위 선택", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "날짜 필터");

    const dateRangePicker = page.locator('[data-testid="date-range-picker"]');
    await dateRangePicker.click();

    // 프리셋 옵션
    await expect(page.getByRole("option", { name: "오늘" })).toBeVisible();
    await expect(page.getByRole("option", { name: "어제" })).toBeVisible();
    await expect(page.getByRole("option", { name: "최근 7일" })).toBeVisible();
    await expect(page.getByRole("option", { name: "최근 30일" })).toBeVisible();
    await expect(page.getByRole("option", { name: "이번 달" })).toBeVisible();
    await expect(page.getByRole("option", { name: "지난 달" })).toBeVisible();

    // 커스텀 범위 선택
    await page.getByRole("option", { name: "커스텀" }).click();

    // 날짜 선택 캘린더
    await expect(page.locator('[data-testid="date-calendar"]')).toBeVisible();
    await expect(page.getByLabel("시작 날짜")).toBeVisible();
    await expect(page.getByLabel("종료 날짜")).toBeVisible();
  });

  test.skip("데이터 내보내기", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "데이터 내보내기");

    // 내보내기 버튼
    const exportButton = page.locator('[data-testid="export-analytics"]');

    if (await exportButton.isVisible()) {
      await exportButton.click();

      // 내보내기 옵션
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "PDF로 내보내기" }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "Excel로 내보내기" }),
      ).toBeVisible();
      await expect(
        page.getByRole("menuitem", { name: "CSV로 내보내기" }),
      ).toBeVisible();

      // PDF 내보내기 선택
      await page.getByRole("menuitem", { name: "PDF로 내보내기" }).click();

      // 내보내기 설정 모달
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("포함할 섹션 선택")).toBeVisible();

      // 취소
      await page.getByRole("button", { name: "취소" }).click();
    }
  });

  test.skip("실시간 데이터 토글", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "실시간 데이터");

    // 실시간 데이터 토글
    const realtimeToggle = page.locator('[data-testid="realtime-toggle"]');

    if (await realtimeToggle.isVisible()) {
      // 현재 상태 확인
      const isEnabled = await realtimeToggle.isChecked();

      // 토글
      await realtimeToggle.click();

      // 상태 변경 확인
      await expect(realtimeToggle).toBeChecked({ checked: !isEnabled });

      if (!isEnabled) {
        // 실시간 데이터 활성화 시 자동 새로고침 표시
        await expect(
          page.locator('[data-testid="auto-refresh-indicator"]'),
        ).toBeVisible();
      }
    }
  });

  test.skip("목표 설정 및 추적", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "목표 관리");

    // 목표 설정 버튼
    const goalsButton = page.locator('[data-testid="set-goals"]');

    if (await goalsButton.isVisible()) {
      await goalsButton.click();

      // 목표 설정 모달
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "목표 설정" }),
      ).toBeVisible();

      // 목표 유형 선택
      await expect(page.getByLabel("목표 유형")).toBeVisible();
      await expect(page.getByLabel("목표 값")).toBeVisible();
      await expect(page.getByLabel("기간")).toBeVisible();

      // 취소
      await page.getByRole("button", { name: "취소" }).click();
    }

    // 목표 진행률 표시
    const goalProgress = page.locator('[data-testid="goal-progress"]');
    if (await goalProgress.isVisible()) {
      await expect(
        goalProgress.locator('[data-testid="progress-bar"]'),
      ).toBeVisible();
      await expect(
        goalProgress.locator('[data-testid="progress-percentage"]'),
      ).toBeVisible();
    }
  });

  test.skip("이상 징후 감지", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "이상 징후");

    // 이상 징후 알림 섹션
    const anomalySection = page.locator('[data-testid="anomaly-detection"]');

    if (await anomalySection.isVisible()) {
      // 이상 징후 카드
      const anomalyCards = anomalySection.locator(
        '[data-testid="anomaly-card"]',
      );
      const count = await anomalyCards.count();

      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const card = anomalyCards.nth(i);

          // 이상 징후 정보
          await expect(
            card.locator('[data-testid="anomaly-type"]'),
          ).toBeVisible();
          await expect(
            card.locator('[data-testid="anomaly-severity"]'),
          ).toBeVisible();
          await expect(
            card.locator('[data-testid="anomaly-description"]'),
          ).toBeVisible();

          // 액션 버튼
          await expect(
            card.locator('[data-testid="investigate-button"]'),
          ).toBeVisible();
        }
      } else {
        // 이상 징후 없음 메시지
        await expect(
          anomalySection.locator('[data-testid="no-anomalies"]'),
        ).toBeVisible();
      }
    }
  });

  test.skip("필터 조합", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "고급 필터");

    // 필터 패널 열기
    const filterButton = page.locator('[data-testid="open-filters"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // 필터 패널
      const filterPanel = page.locator('[data-testid="filter-panel"]');
      await expect(filterPanel).toBeVisible();

      // 플랫폼 필터
      await filterPanel.locator('input[value="Google Ads"]').check();
      await filterPanel.locator('input[value="Facebook Ads"]').check();

      // 캠페인 상태 필터
      await filterPanel.locator('input[value="active"]').check();

      // 성과 범위 필터
      const minSpendInput = filterPanel.locator('[data-testid="min-spend"]');
      if (await minSpendInput.isVisible()) {
        await minSpendInput.fill("100000");
      }

      // 필터 적용
      await filterPanel.locator('[data-testid="apply-filters"]').click();

      // 필터 적용 확인
      await expect(
        page.locator('[data-testid="active-filters"]'),
      ).toBeVisible();
    }
  });
});
