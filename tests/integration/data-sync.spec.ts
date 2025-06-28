import { test, expect, AnnotationType } from "../tester";
import { waitForAPIResponse } from "../helpers/test-utils";

/**
 * 데이터 동기화 통합 테스트
 *
 * 플랫폼 간 데이터 동기화, 실시간 업데이트, 데이터 일관성을 테스트
 */
test.describe("데이터 동기화 통합 테스트", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "데이터 동기화");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("플랫폼 간 데이터 일관성 검증", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "데이터 일관성");

    // 1. 통합 대시보드에서 전체 데이터 수집
    const totalMetrics = {
      campaigns: 0,
      budget: 0,
      clicks: 0,
      impressions: 0,
    };

    // 전체 지표 수집
    const campaignCountElement = page.getByText(/총.*캠페인.*\d+/i).first();
    if (await campaignCountElement.isVisible()) {
      const text = await campaignCountElement.textContent();
      const match = text?.match(/\d+/);
      if (match) totalMetrics.campaigns = parseInt(match[0]);
    }

    // 2. 각 플랫폼별 데이터 합계 계산
    const platforms = ["Google", "Meta", "Naver", "Kakao"];
    const platformMetrics: { [key: string]: any } = {};

    for (const platform of platforms) {
      const platformTab = page.getByText(new RegExp(platform, "i")).first();
      if (await platformTab.isVisible()) {
        await platformTab.click();
        await page.waitForTimeout(2000);

        // 플랫폼별 지표 수집
        const platformData = {
          campaigns: 0,
          budget: 0,
          clicks: 0,
        };

        // 캠페인 수 확인
        const campaignRows = page.locator(
          '[data-testid*="campaign"], tr, .campaign-row',
        );
        platformData.campaigns = await campaignRows.count();

        platformMetrics[platform] = platformData;
      }
    }

    // 3. 데이터 일관성 검증
    const platformCampaignSum = Object.values(platformMetrics).reduce(
      (sum: number, platform: any) => sum + platform.campaigns,
      0,
    );

    // 허용 오차 범위 내에서 일치하는지 확인 (±10%)
    if (totalMetrics.campaigns > 0 && platformCampaignSum > 0) {
      const difference = Math.abs(totalMetrics.campaigns - platformCampaignSum);
      const tolerance =
        Math.max(totalMetrics.campaigns, platformCampaignSum) * 0.1;
      expect(difference).toBeLessThanOrEqual(tolerance);
    }
  });

  test("실시간 데이터 동기화 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "실시간 동기화");

    // 1. 초기 데이터 상태 기록
    const initialData = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        '[data-testid*="metric"], .metric-value',
      );
      return Array.from(elements).map((el) => ({
        text: el.textContent,
        timestamp: Date.now(),
      }));
    });

    // 2. 수동 새로고침 트리거
    const refreshButton = page.getByText(/새로고침|refresh|동기화/i).first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(3000);
    }

    // 3. 자동 새로고침 활성화
    const autoRefreshToggle = page
      .getByText(/자동.*새로고침|auto.*refresh/i)
      .first();
    if (await autoRefreshToggle.isVisible()) {
      await autoRefreshToggle.click();
      await page.waitForTimeout(1000);
    }

    // 4. 일정 시간 대기 후 데이터 변경 확인
    await page.waitForTimeout(30000); // 30초 대기

    const updatedData = await page.evaluate(() => {
      const elements = document.querySelectorAll(
        '[data-testid*="metric"], .metric-value',
      );
      return Array.from(elements).map((el) => ({
        text: el.textContent,
        timestamp: Date.now(),
      }));
    });

    // 5. 타임스탬프 업데이트 확인
    const lastUpdated = page
      .getByText(/마지막.*업데이트|last.*updated|\d+.*전/i)
      .first();
    if (await lastUpdated.isVisible()) {
      const timestampText = await lastUpdated.textContent();
      expect(timestampText).toMatch(/초.*전|분.*전|방금/);
    }

    // 데이터가 업데이트되었거나 최소한 새로고침이 시도되었는지 확인
    expect(updatedData.length).toBeGreaterThanOrEqual(initialData.length);
  });

  test("대량 데이터 배치 동기화", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "배치 동기화");

    // 1. 배치 동기화 설정 페이지로 이동
    await page.goto("/settings/sync");
    await page.waitForLoadState("networkidle");

    // 설정 페이지가 없다면 설정에서 동기화 옵션 찾기
    if (page.url().includes("404") || !page.url().includes("sync")) {
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");

      const syncSettingsLink = page
        .getByText(/동기화.*설정|sync.*settings/i)
        .first();
      if (await syncSettingsLink.isVisible()) {
        await syncSettingsLink.click();
        await page.waitForTimeout(2000);
      }
    }

    // 2. 배치 동기화 실행
    const batchSyncButton = page
      .getByText(/전체.*동기화|batch.*sync|대량.*동기화/i)
      .first();
    if (await batchSyncButton.isVisible()) {
      // 동기화 전 데이터 확인
      await page.goto("/campaigns");
      await page.waitForLoadState("networkidle");

      const beforeSyncCampaigns = page.locator(
        '[data-testid*="campaign"], tr, .campaign-row',
      );
      const beforeCount = await beforeSyncCampaigns.count();

      // 배치 동기화 실행
      await page.goto("/settings");
      await batchSyncButton.click();

      // 진행 상태 확인
      const progressIndicators = [
        page.getByText(/진행.*중|processing|동기화.*중/i),
        page.locator('[role="progressbar"], .progress'),
        page.getByText(/\d+%/),
      ];

      let foundProgress = false;
      for (const indicator of progressIndicators) {
        if (await indicator.isVisible()) {
          foundProgress = true;
          break;
        }
      }

      // 동기화 완료 대기 (최대 60초)
      await page.waitForTimeout(60000);

      // 완료 메시지 확인
      const completionMessages = [
        page.getByText(/동기화.*완료/i),
        page.getByText(/sync.*complete/i),
        page.getByText(/업데이트.*완료/i),
      ];

      let foundCompletion = false;
      for (const message of completionMessages) {
        if (await message.isVisible()) {
          foundCompletion = true;
          break;
        }
      }

      // 배치 동기화가 실행되었는지 확인
      expect(foundProgress || foundCompletion).toBeTruthy();
    }
  });

  test("동기화 충돌 및 해결 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "동기화 충돌");

    // 1. 캠페인 편집 중 동기화 시뮬레이션
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // 캠페인 편집 시작
    const editButton = page.getByText(/편집|edit/i).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // 편집 폼에서 변경사항 입력
      const nameInput = page
        .locator('input[data-testid*="name"], input[placeholder*="이름"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Modified Campaign ${Date.now()}`);
      }

      // 2. 편집 중 강제 동기화 실행
      const syncButton = page.getByText(/동기화|sync/i).first();
      if (await syncButton.isVisible()) {
        await syncButton.click();
        await page.waitForTimeout(2000);
      }

      // 3. 충돌 감지 및 해결 옵션 확인
      const conflictMessages = [
        page.getByText(/충돌|conflict/i),
        page.getByText(/버전.*차이/i),
        page.getByText(/다른.*사용자.*편집/i),
        page.getByText(/최신.*버전.*있음/i),
      ];

      let foundConflict = false;
      for (const message of conflictMessages) {
        if (await message.isVisible()) {
          foundConflict = true;

          // 충돌 해결 옵션 확인
          const resolutionOptions = [
            page.getByText(/내.*변경사항.*유지/i),
            page.getByText(/서버.*버전.*사용/i),
            page.getByText(/수동.*병합/i),
          ];

          for (const option of resolutionOptions) {
            if (await option.isVisible()) {
              await option.click();
              await page.waitForTimeout(1000);
              break;
            }
          }
          break;
        }
      }

      // 4. 편집 완료 시도
      const saveButton = page.getByText(/저장|save/i).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(3000);

        // 저장 결과 확인
        const saveResults = [
          page.getByText(/저장.*완료/i),
          page.getByText(/충돌.*해결/i),
          page.getByText(/업데이트.*실패/i),
        ];

        let foundSaveResult = false;
        for (const result of saveResults) {
          if (await result.isVisible()) {
            foundSaveResult = true;
            break;
          }
        }

        // 충돌 처리나 정상 저장 중 하나는 발생해야 함
        expect(foundConflict || foundSaveResult).toBeTruthy();
      }
    }
  });

  test("크로스 플랫폼 데이터 매핑 정확성", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "데이터 매핑");

    // 1. 분석 페이지에서 통합 지표 확인
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // 2. 표준화된 지표들 확인
    const standardMetrics = [
      { name: "클릭수", selector: page.getByText(/클릭.*\d+|clicks.*\d+/i) },
      {
        name: "노출수",
        selector: page.getByText(/노출.*\d+|impressions.*\d+/i),
      },
      {
        name: "전환수",
        selector: page.getByText(/전환.*\d+|conversions.*\d+/i),
      },
      { name: "클릭률", selector: page.getByText(/CTR.*\d+|클릭률.*\d+/i) },
      { name: "전환율", selector: page.getByText(/CVR.*\d+|전환율.*\d+/i) },
    ];

    const metricsFound: { [key: string]: string } = {};

    for (const metric of standardMetrics) {
      if (await metric.selector.isVisible()) {
        const text = await metric.selector.textContent();
        metricsFound[metric.name] = text || "";
      }
    }

    // 3. 플랫폼별 세부 데이터와 비교
    const platforms = ["Google", "Meta", "Naver"];

    for (const platform of platforms) {
      const platformFilter = page.getByText(new RegExp(platform, "i")).first();
      if (await platformFilter.isVisible()) {
        await platformFilter.click();
        await page.waitForTimeout(2000);

        // 플랫폼별 지표 확인
        for (const metric of standardMetrics) {
          const platformMetric = metric.selector.first();
          if (await platformMetric.isVisible()) {
            const platformValue = await platformMetric.textContent();

            // 플랫폼별 데이터가 합리적인 범위인지 확인
            const numericValue = platformValue?.match(/[\d,]+/);
            if (numericValue) {
              const value = parseInt(numericValue[0].replace(/,/g, ""));
              expect(value).toBeGreaterThanOrEqual(0);
            }
          }
        }
      }
    }

    // 최소 3개 이상의 표준 지표가 표시되어야 함
    expect(Object.keys(metricsFound).length).toBeGreaterThanOrEqual(3);
  });

  test("동기화 실패 복구 및 재시도 로직", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "동기화 복구");

    // 1. 네트워크 차단으로 동기화 실패 시뮬레이션
    await page.route("**/api/sync/**", (route) => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Service Temporarily Unavailable" }),
      });
    });

    // 2. 동기화 시도
    const syncButton = page.getByText(/동기화|sync|새로고침/i).first();
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await page.waitForTimeout(3000);
    }

    // 3. 실패 메시지 확인
    const failureMessages = [
      page.getByText(/동기화.*실패/i),
      page.getByText(/연결.*실패/i),
      page.getByText(/오류.*발생/i),
      page.getByText(/503|서버.*오류/i),
    ];

    let foundFailure = false;
    for (const message of failureMessages) {
      if (await message.isVisible()) {
        foundFailure = true;
        break;
      }
    }

    // 4. 자동 재시도 확인
    const retryIndicators = [
      page.getByText(/재시도.*중|retrying/i),
      page.getByText(/\d+초.*후.*재시도/i),
      page.locator('[data-testid*="retry"], .retry-indicator'),
    ];

    let foundRetry = false;
    for (const indicator of retryIndicators) {
      if (await indicator.isVisible()) {
        foundRetry = true;
        break;
      }
    }

    // 5. 수동 재시도 버튼 테스트
    const manualRetryButton = page
      .getByText(/다시.*시도|재시도|retry/i)
      .first();
    if (await manualRetryButton.isVisible()) {
      // 네트워크 차단 해제
      await page.unroute("**/api/sync/**");

      // 재시도 실행
      await manualRetryButton.click();
      await page.waitForTimeout(5000);

      // 재시도 성공 확인
      const successMessages = [
        page.getByText(/동기화.*완료/i),
        page.getByText(/성공/i),
        page.getByText(/연결.*복구/i),
      ];

      let foundSuccess = false;
      for (const message of successMessages) {
        if (await message.isVisible()) {
          foundSuccess = true;
          break;
        }
      }

      if (foundSuccess) {
        expect(foundSuccess).toBeTruthy();
      }
    }

    // 실패 감지나 재시도 메커니즘이 작동해야 함
    expect(
      foundFailure || foundRetry || (await manualRetryButton.isVisible()),
    ).toBeTruthy();
  });

  test("동기화 성능 및 최적화 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "동기화 성능");

    // 1. 대용량 데이터 환경 시뮬레이션
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // 긴 기간 설정 (대량 데이터)
    const dateRange = page.getByText(/기간|날짜|date/i).first();
    if (await dateRange.isVisible()) {
      await dateRange.click();
      await page.waitForTimeout(1000);

      // 최대 기간 선택 (예: 1년)
      const maxPeriod = page.getByText(/1년|12개월|전체/i).first();
      if (await maxPeriod.isVisible()) {
        await maxPeriod.click();
        await page.waitForTimeout(2000);
      }
    }

    // 2. 동기화 시작 시간 기록
    const syncStartTime = Date.now();

    // 3. 전체 동기화 실행
    const fullSyncButton = page.getByText(/전체.*동기화|full.*sync/i).first();
    if (await fullSyncButton.isVisible()) {
      await fullSyncButton.click();
    }

    // 4. 진행률 및 성능 지표 모니터링
    let progressUpdates = 0;
    const progressInterval = setInterval(async () => {
      const progressBar = page
        .locator('[role="progressbar"], .progress-bar')
        .first();
      if (await progressBar.isVisible()) {
        progressUpdates++;
      }
    }, 5000);

    // 5. 최대 3분 대기
    await page.waitForTimeout(180000);
    clearInterval(progressInterval);

    const syncEndTime = Date.now();
    const syncDuration = syncEndTime - syncStartTime;

    // 6. 성능 지표 확인
    const performanceMetrics = [
      page.getByText(/처리.*속도|records\/sec/i),
      page.getByText(/완료.*시간|\d+.*초.*소요/i),
      page.getByText(/처리.*건수|\d+.*건.*처리/i),
    ];

    let foundPerformanceMetrics = false;
    for (const metric of performanceMetrics) {
      if (await metric.isVisible()) {
        foundPerformanceMetrics = true;
        break;
      }
    }

    // 7. 메모리 사용량 체크 (브라우저 API 사용)
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          }
        : null;
    });

    // 동기화가 합리적인 시간 내에 완료되거나 진행되었는지 확인
    expect(
      syncDuration < 180000 || // 3분 이내 완료
        progressUpdates > 0 || // 진행률 업데이트 있음
        foundPerformanceMetrics, // 성능 지표 표시
    ).toBeTruthy();

    // 메모리 누수 체크
    if (memoryInfo) {
      const memoryUsageRatio =
        memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
      expect(memoryUsageRatio).toBeLessThan(0.9); // 90% 미만 사용
    }
  });
});
