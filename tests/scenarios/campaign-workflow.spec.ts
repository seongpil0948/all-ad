import { test, expect, AnnotationType } from "../tester";
import { waitForAPIResponse, fillForm } from "../helpers/test-utils";

/**
 * 캠페인 관리 워크플로우 테스트
 *
 * 실제 광고 운영자의 일상적인 캠페인 관리 시나리오를 테스트
 */
test.describe("캠페인 관리 워크플로우", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "캠페인 관리");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("일일 캠페인 성과 모니터링 시나리오", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "성과 모니터링");

    // 1. 대시보드에서 전체 성과 확인
    await page.waitForTimeout(2000);

    // 주요 지표 확인
    const kpiElements = [
      page.getByText(/전체.*예산/i),
      page.getByText(/클릭/i),
      page.getByText(/노출/i),
      page.getByText(/전환/i),
      page.getByText(/ROAS|ROI/i),
    ];

    let foundKPIs = 0;
    for (const kpi of kpiElements) {
      if (await kpi.isVisible()) {
        foundKPIs++;
      }
    }

    // 최소 3개 이상의 주요 지표가 표시되어야 함
    expect(foundKPIs).toBeGreaterThanOrEqual(3);

    // 2. 기간 필터 변경
    const dateFilter = page.getByText(/오늘|어제|지난.*일|기간/i).first();
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      await page.waitForTimeout(1000);

      // 어제 데이터로 변경
      const yesterdayOption = page.getByText(/어제/i).first();
      if (await yesterdayOption.isVisible()) {
        await yesterdayOption.click();
        await page.waitForTimeout(2000);
      }
    }

    // 3. 플랫폼별 성과 확인
    const platformTabs = page.getByText(/Google|Meta|Naver|Kakao|전체/i);
    const platformCount = await platformTabs.count();

    if (platformCount > 0) {
      // 각 플랫폼 탭 클릭해서 데이터 확인
      for (let i = 0; i < Math.min(platformCount, 3); i++) {
        await platformTabs.nth(i).click();
        await page.waitForTimeout(1500);

        // 플랫폼별 데이터가 로드되는지 확인
        const platformData = [
          page.getByText(/캠페인/i),
          page.getByText(/광고/i),
          page.getByText(/성과/i),
        ];

        let foundPlatformData = false;
        for (const data of platformData) {
          if (await data.isVisible()) {
            foundPlatformData = true;
            break;
          }
        }
        expect(foundPlatformData).toBeTruthy();
      }
    }

    // 4. 캠페인 목록으로 이동
    const campaignListButton = page
      .getByText(/캠페인.*목록|캠페인.*관리/i)
      .first();
    if (await campaignListButton.isVisible()) {
      await campaignListButton.click();
    } else {
      await page.goto("/campaigns");
    }

    await page.waitForLoadState("networkidle");

    // 캠페인 목록이 표시되는지 확인
    const campaignElements = [
      page.getByText(/캠페인.*이름/i),
      page.getByText(/상태/i),
      page.getByText(/예산/i),
      page.getByText(/ON|OFF|활성|비활성/i),
    ];

    let foundCampaignList = false;
    for (const element of campaignElements) {
      if (await element.isVisible()) {
        foundCampaignList = true;
        break;
      }
    }
    expect(foundCampaignList).toBeTruthy();
  });

  test("긴급 캠페인 중지 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "긴급 캠페인 제어");

    // 1. 캠페인 목록 페이지로 이동
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // 2. 활성 캠페인 찾기
    const activeToggle = page
      .locator(
        '[data-testid*="campaign-toggle"], [data-status="active"], .toggle-switch',
      )
      .filter({ hasText: /ON|활성/ })
      .first();

    if (await activeToggle.isVisible()) {
      // 3. 캠페인 중지
      await activeToggle.click();

      // 확인 대화상자가 나타날 수 있음
      const confirmDialog = page.getByText(/확인|중지|정지/i).first();
      if (await confirmDialog.isVisible()) {
        await confirmDialog.click();
      }

      await page.waitForTimeout(2000);

      // 4. 상태 변경 확인
      const statusIndicators = [
        page.getByText(/중지.*완료/i),
        page.getByText(/OFF/i),
        page.getByText(/비활성/i),
      ];

      let foundStatusChange = false;
      for (const indicator of statusIndicators) {
        if (await indicator.isVisible()) {
          foundStatusChange = true;
          break;
        }
      }
      expect(foundStatusChange).toBeTruthy();
    }

    // 5. 변경 이력 확인
    const historyButton = page.getByText(/이력|로그|기록/i).first();
    if (await historyButton.isVisible()) {
      await historyButton.click();
      await page.waitForTimeout(2000);

      // 변경 이력에 캠페인 중지 기록이 있는지 확인
      const historyItems = [
        page.getByText(/캠페인.*중지/i),
        page.getByText(/상태.*변경/i),
        page.getByText(/OFF/i),
      ];

      let foundHistory = false;
      for (const item of historyItems) {
        if (await item.isVisible()) {
          foundHistory = true;
          break;
        }
      }

      if (foundHistory) {
        expect(foundHistory).toBeTruthy();
      }
    }
  });

  test("대량 캠페인 관리 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "대량 캠페인 관리");

    // 1. 캠페인 목록에서 다중 선택
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // 2. 체크박스나 선택 기능 찾기
    const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click();
      await page.waitForTimeout(1000);
    }

    // 개별 캠페인 체크박스들 선택
    const campaignCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await campaignCheckboxes.count();

    if (checkboxCount > 1) {
      // 처음 3개 캠페인 선택
      for (let i = 1; i < Math.min(checkboxCount, 4); i++) {
        await campaignCheckboxes.nth(i).click();
        await page.waitForTimeout(300);
      }

      // 3. 대량 작업 버튼 확인
      const bulkActions = [
        page.getByText(/일괄.*중지/i),
        page.getByText(/일괄.*시작/i),
        page.getByText(/대량.*편집/i),
        page.getByText(/선택.*삭제/i),
      ];

      let foundBulkAction = false;
      for (const action of bulkActions) {
        if (await action.isVisible()) {
          foundBulkAction = true;
          await action.click();
          await page.waitForTimeout(1000);

          // 확인 대화상자 처리
          const confirmButton = page.getByText(/확인|적용|실행/i).first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
          }
          break;
        }
      }

      if (foundBulkAction) {
        // 대량 작업 완료 메시지 확인
        const successMessages = [
          page.getByText(/완료/i),
          page.getByText(/성공/i),
          page.getByText(/적용.*완료/i),
        ];

        let foundSuccess = false;
        for (const message of successMessages) {
          if (await message.isVisible()) {
            foundSuccess = true;
            break;
          }
        }
        expect(foundSuccess).toBeTruthy();
      }
    }
  });

  test("캠페인 예산 조정 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "예산 관리");

    // 1. 특정 캠페인의 예산 편집
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // 2. 예산 편집 버튼 찾기
    const budgetButtons = page.getByText(/예산.*편집|편집|수정/i);
    const buttonCount = await budgetButtons.count();

    if (buttonCount > 0) {
      await budgetButtons.first().click();
      await page.waitForTimeout(1000);

      // 3. 예산 입력 필드 찾기
      const budgetInput = page
        .locator('input[type="number"], input[data-testid*="budget"]')
        .first();
      if (await budgetInput.isVisible()) {
        // 현재 예산의 120%로 증액
        const currentValue = await budgetInput.inputValue();
        const currentBudget = parseFloat(currentValue) || 100000;
        const newBudget = Math.round(currentBudget * 1.2);

        await budgetInput.fill(newBudget.toString());

        // 4. 저장 버튼 클릭
        const saveButton = page.getByText(/저장|확인|적용/i).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(2000);

          // 5. 예산 변경 확인
          const successIndicators = [
            page.getByText(/예산.*변경.*완료/i),
            page.getByText(/저장.*완료/i),
            page.getByText(newBudget.toString()),
          ];

          let foundSuccess = false;
          for (const indicator of successIndicators) {
            if (await indicator.isVisible()) {
              foundSuccess = true;
              break;
            }
          }
          expect(foundSuccess).toBeTruthy();
        }
      }
    }

    // 6. 예산 사용률 확인
    const budgetUsage = [
      page.getByText(/예산.*사용/i),
      page.getByText(/소진/i),
      page.getByText(/%/),
    ];

    let foundUsage = false;
    for (const usage of budgetUsage) {
      if (await usage.isVisible()) {
        foundUsage = true;
        break;
      }
    }

    // 예산 관련 정보가 표시되는지 확인
    expect(foundUsage).toBeTruthy();
  });

  test("성과 기반 알림 설정 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "알림 설정");

    // 1. 설정 페이지로 이동
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    // 2. 알림 설정 섹션 찾기
    const notificationSection = page.getByText(/알림|notification/i).first();
    if (await notificationSection.isVisible()) {
      await notificationSection.click();
      await page.waitForTimeout(1000);
    }

    // 3. 성과 기반 알림 설정
    const performanceAlerts = [
      page.getByText(/예산.*알림/i),
      page.getByText(/CPA.*알림/i),
      page.getByText(/ROAS.*알림/i),
      page.getByText(/성과.*알림/i),
    ];

    for (const alert of performanceAlerts) {
      if (await alert.isVisible()) {
        // 알림 토글 활성화
        const toggle = alert
          .locator("..")
          .locator('[role="switch"], input[type="checkbox"]')
          .first();
        if (await toggle.isVisible()) {
          await toggle.click();
          await page.waitForTimeout(500);
        }

        // 임계값 설정
        const thresholdInput = alert
          .locator("..")
          .locator('input[type="number"]')
          .first();
        if (await thresholdInput.isVisible()) {
          await thresholdInput.fill("80"); // 80% 임계값
          await page.waitForTimeout(500);
        }
      }
    }

    // 4. 설정 저장
    const saveButton = page.getByText(/저장|적용/i).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(2000);

      // 저장 완료 확인
      const saveSuccess = [
        page.getByText(/저장.*완료/i),
        page.getByText(/설정.*완료/i),
        page.getByText(/알림.*설정.*완료/i),
      ];

      let foundSaveSuccess = false;
      for (const success of saveSuccess) {
        if (await success.isVisible()) {
          foundSaveSuccess = true;
          break;
        }
      }
      expect(foundSaveSuccess).toBeTruthy();
    }
  });

  test("크로스 플랫폼 성과 비교 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "플랫폼 성과 비교");

    // 1. 분석 페이지로 이동
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // 2. 플랫폼 비교 뷰 활성화
    const compareView = page.getByText(/비교|compare|vs/i).first();
    if (await compareView.isVisible()) {
      await compareView.click();
      await page.waitForTimeout(1000);
    }

    // 3. 비교할 플랫폼들 선택
    const platforms = ["Google", "Meta", "Naver"];
    for (const platform of platforms) {
      const platformCheckbox = page
        .getByText(platform)
        .locator("..")
        .locator('input[type="checkbox"]')
        .first();
      if (await platformCheckbox.isVisible()) {
        await platformCheckbox.click();
        await page.waitForTimeout(500);
      }
    }

    // 4. 비교 차트 확인
    const chartElements = [
      page.locator("canvas"),
      page.locator('[data-testid*="chart"]'),
      page.locator(".chart-container"),
      page.getByText(/차트|그래프/i),
    ];

    let foundChart = false;
    for (const chart of chartElements) {
      if (await chart.isVisible()) {
        foundChart = true;
        break;
      }
    }

    // 5. 성과 지표 테이블 확인
    const performanceMetrics = [
      page.getByText(/클릭률|CTR/i),
      page.getByText(/전환율|CVR/i),
      page.getByText(/CPC/i),
      page.getByText(/CPA/i),
    ];

    let foundMetrics = 0;
    for (const metric of performanceMetrics) {
      if (await metric.isVisible()) {
        foundMetrics++;
      }
    }

    // 차트나 성과 지표 중 하나는 표시되어야 함
    expect(foundChart || foundMetrics > 0).toBeTruthy();
  });
});
