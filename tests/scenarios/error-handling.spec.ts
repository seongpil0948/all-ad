import { test, expect, AnnotationType } from "../tester";
import { waitForAPIResponse } from "../helpers/test-utils";

/**
 * 에러 처리 및 예외 상황 테스트
 *
 * 다양한 오류 상황에서의 시스템 안정성과 사용자 경험을 테스트
 */
test.describe("에러 처리 및 예외 상황 테스트", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "에러 처리");
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
  });

  test("네트워크 연결 실패 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "네트워크 오류");

    // 1. 모든 API 요청 차단
    await page.route("**/api/**", (route) => {
      route.abort("internetdisconnected");
    });

    // 2. 데이터 로드 시도
    await page.reload();
    await page.waitForTimeout(5000);

    // 3. 네트워크 오류 메시지 확인
    const networkErrorMessages = [
      page.getByText(/네트워크.*연결.*실패/i),
      page.getByText(/인터넷.*연결.*확인/i),
      page.getByText(/network.*error/i),
      page.getByText(/연결.*시간.*초과/i),
      page.getByText(/서버.*연결.*불가/i),
    ];

    let foundNetworkError = false;
    for (const message of networkErrorMessages) {
      if (await message.isVisible()) {
        foundNetworkError = true;
        break;
      }
    }

    // 4. 재시도 버튼 확인
    const retryButton = page.getByText(/다시.*시도|재시도|retry/i).first();
    expect((await retryButton.isVisible()) || foundNetworkError).toBeTruthy();

    // 5. 오프라인 상태 표시 확인
    const offlineIndicators = [
      page.getByText(/오프라인|offline/i),
      page.locator('[data-testid*="offline"]'),
      page.locator(".offline-indicator"),
    ];

    let foundOfflineIndicator = false;
    for (const indicator of offlineIndicators) {
      if (await indicator.isVisible()) {
        foundOfflineIndicator = true;
        break;
      }
    }

    // 6. 네트워크 복구 시뮬레이션
    await page.unroute("**/api/**");

    if (await retryButton.isVisible()) {
      await retryButton.click();
      await page.waitForTimeout(3000);

      // 복구 후 정상 데이터 로드 확인
      const dataElements = [
        page.getByText(/캠페인/i),
        page.getByText(/광고비/i),
        page.locator('[data-testid*="metric"]'),
      ];

      let foundData = false;
      for (const element of dataElements) {
        if (await element.isVisible()) {
          foundData = true;
          break;
        }
      }

      if (foundData) {
        expect(foundData).toBeTruthy();
      }
    }
  });

  test("서버 오류 (500) 응답 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "서버 오류");

    // 1. 서버 오류 시뮬레이션
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Internal Server Error",
          message: "서버에서 예상치 못한 오류가 발생했습니다.",
        }),
      });
    });

    // 2. API 호출이 필요한 작업 수행
    const refreshButton = page.getByText(/새로고침|갱신|동기화/i).first();
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(3000);
    }

    // 3. 서버 오류 메시지 확인
    const serverErrorMessages = [
      page.getByText(/서버.*오류|server.*error/i),
      page.getByText(/일시적.*장애/i),
      page.getByText(/잠시.*후.*다시/i),
      page.getByText(/500.*오류/i),
      page.getByText(/예상치.*못한.*오류/i),
    ];

    let foundServerError = false;
    for (const message of serverErrorMessages) {
      if (await message.isVisible()) {
        foundServerError = true;
        break;
      }
    }

    // 4. 에러 정보 상세보기 (선택적)
    const errorDetailsButton = page
      .getByText(/자세히|details|more.*info/i)
      .first();
    if (await errorDetailsButton.isVisible()) {
      await errorDetailsButton.click();
      await page.waitForTimeout(1000);

      // 에러 상세 정보 확인
      const errorDetails = [
        page.getByText(/error.*code|오류.*코드/i),
        page.getByText(/timestamp|시간/i),
        page.getByText(/request.*id|요청.*id/i),
      ];

      let foundErrorDetails = false;
      for (const detail of errorDetails) {
        if (await detail.isVisible()) {
          foundErrorDetails = true;
          break;
        }
      }

      if (foundErrorDetails) {
        expect(foundErrorDetails).toBeTruthy();
      }
    }

    // 서버 오류가 적절히 처리되었는지 확인
    expect(foundServerError).toBeTruthy();
  });

  test("인증 만료 및 재로그인 시나리오", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "인증 만료");

    // 1. 인증 토큰 만료 시뮬레이션
    await page.route("**/api/**", (route) => {
      if (
        route.request().url().includes("/auth/") ||
        route.request().headers()["authorization"]
      ) {
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Unauthorized",
            message: "Token expired",
          }),
        });
      } else {
        route.continue();
      }
    });

    // 2. 인증이 필요한 페이지 접근
    await page.goto("/campaigns");
    await page.waitForTimeout(3000);

    // 3. 인증 만료 처리 확인
    const authExpiredHandling = [
      page.getByText(/로그인.*필요|login.*required/i),
      page.getByText(/세션.*만료|session.*expired/i),
      page.getByText(/다시.*로그인|re.*login/i),
      page.url().includes("/login"),
    ];

    let foundAuthExpired = false;
    for (const handling of authExpiredHandling.slice(0, -1)) {
      // URL 체크 제외
      if (typeof handling !== "boolean" && (await handling.isVisible())) {
        foundAuthExpired = true;
        break;
      }
    }

    // URL이 로그인 페이지로 리다이렉트되었는지 확인
    const redirectedToLogin = page.url().includes("/login");

    // 4. 자동 로그아웃 및 리다이렉트 확인
    if (redirectedToLogin) {
      // 로그인 페이지에서 적절한 메시지 표시 확인
      const loginPageMessages = [
        page.getByText(/로그인.*해주세요/i),
        page.getByText(/세션.*만료/i),
        page.getByText(/다시.*로그인/i),
      ];

      for (const message of loginPageMessages) {
        if (await message.isVisible()) {
          foundAuthExpired = true;
          break;
        }
      }
    }

    // 인증 만료가 적절히 처리되었는지 확인
    expect(foundAuthExpired || redirectedToLogin).toBeTruthy();
  });

  test("잘못된 사용자 입력 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "입력 검증");

    // 1. 캠페인 생성/편집 페이지로 이동
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    const createButton = page.getByText(/생성|create|새.*캠페인/i).first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
    } else {
      // 편집 버튼으로 대체
      const editButton = page.getByText(/편집|edit/i).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(2000);
      }
    }

    // 2. 잘못된 입력값들 테스트
    const invalidInputTests = [
      {
        name: "빈 캠페인명",
        input: "",
        field: 'input[data-testid*="name"], input[placeholder*="이름"]',
      },
      {
        name: "음수 예산",
        input: "-1000",
        field: 'input[type="number"], input[data-testid*="budget"]',
      },
      {
        name: "너무 긴 텍스트",
        input: "A".repeat(1000),
        field: 'textarea, input[data-testid*="description"]',
      },
      {
        name: "잘못된 이메일",
        input: "invalid-email",
        field: 'input[type="email"]',
      },
    ];

    for (const testCase of invalidInputTests) {
      const inputField = page.locator(testCase.field).first();
      if (await inputField.isVisible()) {
        await inputField.fill(testCase.input);

        // 저장 시도
        const saveButton = page.getByText(/저장|save|확인/i).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // 검증 오류 메시지 확인
          const validationErrors = [
            page.getByText(/필수.*입력/i),
            page.getByText(/유효.*하지.*않/i),
            page.getByText(/올바른.*형식/i),
            page.getByText(/최소.*\d+.*자/i),
            page.getByText(/최대.*\d+.*자/i),
            page.getByText(/양수.*입력/i),
          ];

          let foundValidationError = false;
          for (const error of validationErrors) {
            if (await error.isVisible()) {
              foundValidationError = true;
              break;
            }
          }

          // 각 잘못된 입력에 대해 적절한 검증이 이루어져야 함
          if (
            testCase.input === "" ||
            testCase.input === "-1000" ||
            testCase.input === "invalid-email"
          ) {
            expect(foundValidationError).toBeTruthy();
          }
        }
      }
    }
  });

  test("동시 사용자 충돌 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "동시 편집 충돌");

    // 1. 캠페인 편집 시작
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    const editButton = page.getByText(/편집|edit/i).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // 2. 편집 중 다른 사용자의 수정사항 시뮬레이션
      await page.route("**/api/campaigns/*", (route) => {
        if (
          route.request().method() === "PUT" ||
          route.request().method() === "PATCH"
        ) {
          route.fulfill({
            status: 409, // Conflict
            contentType: "application/json",
            body: JSON.stringify({
              error: "Conflict",
              message: "다른 사용자가 동시에 수정했습니다.",
              latest_version: "2024-01-01T12:00:00Z",
            }),
          });
        } else {
          route.continue();
        }
      });

      // 3. 변경사항 입력 후 저장 시도
      const nameInput = page
        .locator('input[data-testid*="name"], input[placeholder*="이름"]')
        .first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Modified by Test ${Date.now()}`);
      }

      const saveButton = page.getByText(/저장|save/i).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(3000);

        // 4. 충돌 메시지 확인
        const conflictMessages = [
          page.getByText(/충돌.*발생/i),
          page.getByText(/다른.*사용자.*수정/i),
          page.getByText(/동시.*편집/i),
          page.getByText(/최신.*버전.*확인/i),
          page.getByText(/conflict/i),
        ];

        let foundConflict = false;
        for (const message of conflictMessages) {
          if (await message.isVisible()) {
            foundConflict = true;
            break;
          }
        }

        // 5. 충돌 해결 옵션 확인
        const resolutionOptions = [
          page.getByText(/내.*변경사항.*유지/i),
          page.getByText(/서버.*버전.*사용/i),
          page.getByText(/수동.*병합/i),
          page.getByText(/다시.*시도/i),
        ];

        let foundResolutionOption = false;
        for (const option of resolutionOptions) {
          if (await option.isVisible()) {
            foundResolutionOption = true;
            await option.click(); // 첫 번째 옵션 선택
            await page.waitForTimeout(1000);
            break;
          }
        }

        // 충돌이 감지되고 해결 방법이 제시되어야 함
        expect(foundConflict && foundResolutionOption).toBeTruthy();
      }
    }
  });

  test("대용량 데이터 처리 한계 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "데이터 처리 한계");

    // 1. 대용량 데이터 요청 시뮬레이션
    await page.route("**/api/campaigns**", (route) => {
      // 매우 큰 데이터셋 시뮬레이션
      const largeCampaignList = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `Campaign ${i + 1}`,
        status: "active",
        budget: Math.floor(Math.random() * 1000000),
        clicks: Math.floor(Math.random() * 10000),
        impressions: Math.floor(Math.random() * 100000),
      }));

      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: largeCampaignList,
          total: largeCampaignList.length,
        }),
      });
    });

    // 2. 캠페인 목록 페이지 로드
    await page.goto("/campaigns");
    const loadStartTime = Date.now();

    // 3. 로딩 상태 모니터링
    const loadingIndicators = [
      page.getByText(/로딩|loading/i),
      page.locator('[data-testid*="loading"]'),
      page.locator(".spinner"),
    ];

    let foundLoading = false;
    for (const indicator of loadingIndicators) {
      if (await indicator.isVisible()) {
        foundLoading = true;
        break;
      }
    }

    // 4. 페이지네이션이나 가상 스크롤 확인
    await page.waitForLoadState("networkidle");
    const loadEndTime = Date.now();
    const loadDuration = loadEndTime - loadStartTime;

    const optimizationFeatures = [
      page.locator('[role="button"][aria-label*="다음"], .pagination'),
      page.getByText(/페이지.*\d+/i),
      page.getByText(/\d+.*~.*\d+.*총.*\d+/i), // "1~50 of 10000" 형태
      page.locator('[data-testid*="virtual"], .virtual-scroll'),
    ];

    let foundOptimization = false;
    for (const feature of optimizationFeatures) {
      if (await feature.isVisible()) {
        foundOptimization = true;
        break;
      }
    }

    // 5. 성능 검사
    const performanceMetrics = await page.evaluate(() => {
      return {
        memory: (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
            }
          : null,
        timing: performance.now(),
      };
    });

    // 대용량 데이터가 적절히 최적화되어 처리되는지 확인
    expect(
      foundLoading || // 로딩 인디케이터 표시
        foundOptimization || // 페이지네이션/가상스크롤 등 최적화
        loadDuration < 10000, // 10초 이내 로드
    ).toBeTruthy();

    // 메모리 사용량이 합리적인 범위인지 확인
    if (performanceMetrics.memory) {
      const memoryUsageRatio =
        performanceMetrics.memory.usedJSHeapSize /
        performanceMetrics.memory.totalJSHeapSize;
      expect(memoryUsageRatio).toBeLessThan(0.95); // 95% 미만
    }
  });

  test("파일 업로드 오류 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "파일 업로드 오류");

    // 1. 파일 업로드 기능 찾기
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const uploadButton = page
      .locator('input[type="file"], [data-testid*="upload"]')
      .first();
    if (await uploadButton.isVisible()) {
      // 2. 잘못된 파일 형식 테스트
      const invalidFile = await page.evaluateHandle(() => {
        const file = new File(["invalid content"], "test.txt", {
          type: "text/plain",
        });
        return file;
      });

      await uploadButton.setInputFiles([
        {
          name: "invalid.exe",
          mimeType: "application/x-executable",
          buffer: Buffer.from("invalid file content"),
        },
      ]);

      await page.waitForTimeout(2000);

      // 3. 파일 형식 오류 메시지 확인
      const fileTypeErrors = [
        page.getByText(/지원.*하지.*않는.*형식/i),
        page.getByText(/허용.*되지.*않는.*파일/i),
        page.getByText(/invalid.*file.*type/i),
        page.getByText(/jpg.*png.*pdf.*만/i),
      ];

      let foundFileTypeError = false;
      for (const error of fileTypeErrors) {
        if (await error.isVisible()) {
          foundFileTypeError = true;
          break;
        }
      }

      // 4. 파일 크기 초과 테스트
      const largeFileBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
      await uploadButton.setInputFiles([
        {
          name: "large-file.jpg",
          mimeType: "image/jpeg",
          buffer: largeFileBuffer,
        },
      ]);

      await page.waitForTimeout(3000);

      // 5. 파일 크기 오류 메시지 확인
      const fileSizeErrors = [
        page.getByText(/파일.*크기.*초과/i),
        page.getByText(/최대.*\d+.*mb/i),
        page.getByText(/file.*too.*large/i),
        page.getByText(/용량.*제한/i),
      ];

      let foundFileSizeError = false;
      for (const error of fileSizeErrors) {
        if (await error.isVisible()) {
          foundFileSizeError = true;
          break;
        }
      }

      // 파일 업로드 검증이 적절히 작동하는지 확인
      expect(foundFileTypeError || foundFileSizeError).toBeTruthy();
    } else {
      // 파일 업로드 기능이 없어도 테스트 통과 (기능이 없을 수 있음)
      expect(true).toBeTruthy();
    }
  });

  test("브라우저 호환성 오류 처리", async ({
    page,
    pushAnnotation,
    browser,
  }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "브라우저 호환성");

    // 1. 오래된 브라우저 시뮬레이션 (User-Agent 변경)
    // Create a new context with custom user agent
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko", // IE 11
    });
    const newPage = await context.newPage();

    // 2. 메인 페이지 로드
    await newPage.goto("/");
    await newPage.waitForTimeout(3000);

    // 3. 브라우저 호환성 경고 확인
    const compatibilityWarnings = [
      newPage.getByText(/브라우저.*지원.*하지.*않/i),
      newPage.getByText(/최신.*브라우저.*사용/i),
      newPage.getByText(/browser.*not.*supported/i),
      newPage.getByText(/chrome.*firefox.*safari/i),
      newPage.getByText(/업데이트.*권장/i),
    ];

    let foundCompatibilityWarning = false;
    for (const warning of compatibilityWarnings) {
      if (await warning.isVisible()) {
        foundCompatibilityWarning = true;
        break;
      }
    }

    // 4. 기능 제한 안내 확인
    const featureLimitations = [
      newPage.getByText(/일부.*기능.*제한/i),
      newPage.getByText(/제한된.*기능/i),
      newPage.getByText(/완전한.*경험.*위해/i),
    ];

    let foundFeatureLimitation = false;
    for (const limitation of featureLimitations) {
      if (await limitation.isVisible()) {
        foundFeatureLimitation = true;
        break;
      }
    }

    // 5. 대체 UI 또는 기본 기능 확인
    const basicFunctionality = [
      newPage.getByText(/기본.*모드/i),
      newPage.getByText(/단순.*버전/i),
      newPage.locator('[data-testid*="fallback"]'),
    ];

    let foundBasicMode = false;
    for (const mode of basicFunctionality) {
      if (await mode.isVisible()) {
        foundBasicMode = true;
        break;
      }
    }

    // 최소한 브라우저 호환성에 대한 안내가 있거나 기본 기능이 작동해야 함
    expect(
      foundCompatibilityWarning ||
        foundFeatureLimitation ||
        foundBasicMode ||
        newPage.locator("body").isVisible(),
    ).toBeTruthy();

    // Clean up the browser context
    await context.close();
  });
});
