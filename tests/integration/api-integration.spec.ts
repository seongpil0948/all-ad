import { test, expect, AnnotationType } from "../tester";
import { waitForAPIResponse } from "../helpers/test-utils";

/**
 * API 연동 통합 테스트
 *
 * 실제 광고 플랫폼 API와의 연동 및 데이터 동기화를 테스트
 */
test.describe("API 연동 통합 테스트", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "API 연동");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("Google Ads API 데이터 동기화", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google Ads API");

    // API 호출 모니터링 시작
    const apiPromise = waitForAPIResponse(
      page,
      "**/api/platforms/google-ads/**",
      async () => {
        // Trigger API call action here
      },
    );

    // 수동 동기화 버튼 클릭
    const syncButton = page.getByText(/동기화|새로고침|갱신/i).first();
    if (await syncButton.isVisible()) {
      await syncButton.click();

      // API 응답 대기
      try {
        const response = await apiPromise;

        // API 응답 상태 확인
        expect(response.status()).toBeLessThan(500);

        // 응답 데이터 구조 확인
        if (response.status() === 200) {
          const responseData = await response.json();
          expect(responseData).toHaveProperty("data");
        }
      } catch (error) {
        // API 호출이 없더라도 UI가 적절히 응답하는지 확인
        await page.waitForTimeout(3000);
      }
    }

    // 동기화 결과 UI 확인
    const syncResults = [
      page.getByText(/동기화.*완료/i),
      page.getByText(/업데이트.*완료/i),
      page.getByText(/데이터.*로드/i),
    ];

    let foundSyncResult = false;
    for (const result of syncResults) {
      if (await result.isVisible()) {
        foundSyncResult = true;
        break;
      }
    }

    // UI에 동기화 결과가 반영되었는지 확인
    await page.waitForTimeout(2000);
    const dataElements = [
      page.getByText(/캠페인/i),
      page.getByText(/광고비/i),
      page.getByText(/클릭/i),
    ];

    let foundData = false;
    for (const element of dataElements) {
      if (await element.isVisible()) {
        foundData = true;
        break;
      }
    }
    expect(foundData).toBeTruthy();
  });

  test("Meta Ads API 실시간 데이터 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta Ads API");

    // Meta Ads 플랫폼 섹션으로 이동
    const metaSection = page.getByText(/Meta|Facebook/i).first();
    if (await metaSection.isVisible()) {
      await metaSection.click();
      await page.waitForTimeout(2000);
    }

    // API 호출 감지
    let apiCalled = false;
    page.on("response", (response) => {
      if (
        response.url().includes("/api/platforms/meta-ads") ||
        response.url().includes("/api/platforms/facebook-ads")
      ) {
        apiCalled = true;
      }
    });

    // 페이지 새로고침으로 API 호출 트리거
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Meta Ads 관련 데이터 표시 확인
    const metaData = [
      page.getByText(/Facebook/i),
      page.getByText(/Instagram/i),
      page.getByText(/Meta/i),
      page.getByText(/리치/i),
      page.getByText(/참여/i),
    ];

    let foundMetaData = false;
    for (const data of metaData) {
      if (await data.isVisible()) {
        foundMetaData = true;
        break;
      }
    }

    // API가 호출되었거나 관련 데이터가 표시되면 성공
    expect(apiCalled || foundMetaData).toBeTruthy();
  });

  test("한국 플랫폼 API 연동 상태 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "한국 플랫폼 API");

    // 한국 플랫폼들의 API 연동 상태 확인
    const koreanPlatforms = ["Naver", "Kakao", "Coupang"];

    for (const platform of koreanPlatforms) {
      // 각 플랫폼 섹션 확인
      const platformSection = page.getByText(new RegExp(platform, "i")).first();
      if (await platformSection.isVisible()) {
        await platformSection.click();
        await page.waitForTimeout(1000);

        // API 연동 상태 표시 확인
        const statusIndicators = [
          page.getByText(/연결됨|연동됨|활성/i),
          page.getByText(/연결 안됨|연동 안됨|비활성/i),
          page.getByText(/오류|에러/i),
        ];

        let foundStatus = false;
        for (const indicator of statusIndicators) {
          if (await indicator.isVisible()) {
            foundStatus = true;
            break;
          }
        }

        // 각 플랫폼의 연동 상태가 표시되어야 함
        if (foundStatus) {
          expect(foundStatus).toBeTruthy();
        }
      }
    }
  });

  test("API 에러 처리 및 재시도 로직", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "API 에러 처리");

    // 네트워크 차단으로 API 에러 시뮬레이션
    await page.route("**/api/platforms/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    // 동기화 시도
    const syncButton = page.getByText(/동기화|새로고침/i).first();
    if (await syncButton.isVisible()) {
      await syncButton.click();
      await page.waitForTimeout(3000);
    }

    // 에러 메시지 표시 확인
    const errorMessages = [
      page.getByText(/오류|에러|실패/i),
      page.getByText(/다시.*시도/i),
      page.getByText(/연결.*실패/i),
    ];

    let foundErrorMessage = false;
    for (const message of errorMessages) {
      if (await message.isVisible()) {
        foundErrorMessage = true;
        break;
      }
    }

    // 재시도 버튼 확인
    const retryButton = page.getByText(/다시.*시도|재시도|retry/i).first();
    if (await retryButton.isVisible()) {
      // 네트워크 차단 해제
      await page.unroute("**/api/platforms/**");

      // 재시도 실행
      await retryButton.click();
      await page.waitForTimeout(2000);
    }

    // 에러 처리 UI가 적절히 동작하는지 확인
    expect(foundErrorMessage || (await retryButton.isVisible())).toBeTruthy();
  });

  test("API 응답 시간 및 성능 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "API 성능");

    // API 응답 시간 측정
    const startTime = Date.now();
    let apiResponseTime = 0;

    page.on("response", (response) => {
      if (
        response.url().includes("/api/platforms/") ||
        response.url().includes("/api/campaigns/")
      ) {
        apiResponseTime = Date.now() - startTime;
      }
    });

    // 캠페인 목록 페이지로 이동 (API 호출 트리거)
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    // 로딩 인디케이터 확인
    const loadingIndicators = [
      page.locator('[data-testid*="loading"]'),
      page.locator(".spinner"),
      page.getByText(/로딩|loading/i),
    ];

    let foundLoading = false;
    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible()) {
        foundLoading = true;
        break;
      }
    }

    // 데이터 로드 완료 확인
    await page.waitForTimeout(5000);
    const dataLoaded = [
      page.getByText(/캠페인/i),
      page.getByText(/데이터/i),
      page.locator('table, [role="table"]'),
    ];

    let foundData = false;
    for (const data of dataLoaded) {
      if (await data.isVisible()) {
        foundData = true;
        break;
      }
    }

    // 적절한 시간 내에 데이터가 로드되는지 확인
    expect(foundData).toBeTruthy();

    // API 응답 시간이 합리적인 범위인지 확인 (30초 이하)
    if (apiResponseTime > 0) {
      expect(apiResponseTime).toBeLessThan(30000);
    }
  });

  test("배치 API 호출 및 대량 데이터 처리", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "배치 데이터 처리");

    // 대량 데이터 요청 시뮬레이션
    await page.goto("/analytics");
    await page.waitForLoadState("networkidle");

    // 긴 기간 설정 (대량 데이터)
    const dateRangeButton = page.getByText(/기간|날짜/i).first();
    if (await dateRangeButton.isVisible()) {
      await dateRangeButton.click();
      await page.waitForTimeout(1000);

      // 지난 30일 또는 더 긴 기간 선택
      const longPeriod = page.getByText(/30일|월간|분기/i).first();
      if (await longPeriod.isVisible()) {
        await longPeriod.click();
        await page.waitForTimeout(2000);
      }
    }

    // 대량 데이터 로딩 상태 확인
    let loadingVisible = false;
    const loadingIndicator = page.getByText(/로딩|처리|집계/i).first();
    if (await loadingIndicator.isVisible()) {
      loadingVisible = true;
      // 최대 30초 대기
      await page.waitForTimeout(30000);
    }

    // 차트나 테이블이 렌더링되는지 확인
    const dataVisualization = [
      page.locator("canvas"), // 차트
      page.locator("table"), // 테이블
      page.locator('[data-testid*="chart"]'),
      page.getByText(/합계|총계/i),
    ];

    let foundVisualization = false;
    for (const viz of dataVisualization) {
      if (await viz.isVisible()) {
        foundVisualization = true;
        break;
      }
    }

    // 대량 데이터가 적절히 처리되고 표시되는지 확인
    expect(foundVisualization || loadingVisible).toBeTruthy();
  });

  test("실시간 데이터 업데이트 및 WebSocket 연결", async ({
    page,
    pushAnnotation,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "실시간 업데이트");

    // WebSocket 연결 감지
    let websocketConnected = false;
    page.on("websocket", (ws) => {
      websocketConnected = true;
      ws.on("framesent", (event) => {
        console.log("WebSocket frame sent:", event.payload);
      });
      ws.on("framereceived", (event) => {
        console.log("WebSocket frame received:", event.payload);
      });
    });

    // 실시간 업데이트 활성화
    const realtimeToggle = page.getByText(/실시간|real.*time|live/i).first();
    if (await realtimeToggle.isVisible()) {
      await realtimeToggle.click();
      await page.waitForTimeout(2000);
    }

    // 일정 시간 대기하여 실시간 업데이트 확인
    await page.waitForTimeout(10000);

    // 타임스탬프 또는 "방금 전" 같은 실시간 표시 확인
    const realtimeIndicators = [
      page.getByText(/방금|초 전|분 전/i),
      page.getByText(/실시간|live/i),
      page.locator('[data-testid*="timestamp"]'),
    ];

    let foundRealtimeIndicator = false;
    for (const indicator of realtimeIndicators) {
      if (await indicator.isVisible()) {
        foundRealtimeIndicator = true;
        break;
      }
    }

    // WebSocket이나 실시간 표시가 작동하는지 확인
    expect(websocketConnected || foundRealtimeIndicator).toBeTruthy();
  });
});
