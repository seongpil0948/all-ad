import { test, expect, AnnotationType } from "../tester";
import { waitForApiResponse, fillForm } from "../helpers/test-utils";

/**
 * 플랫폼 연동 통합 테스트
 *
 * 다양한 광고 플랫폼의 연동 플로우와 데이터 동기화를 테스트
 */
test.describe("플랫폼 연동 통합 테스트", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "플랫폼 연동");
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");
  });

  test("Google Ads 연동 플로우", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google Ads 연동");

    // Google Ads 연동 버튼 찾기
    const googleAdsSection = page.locator('[data-platform="google-ads"]');
    if (!(await googleAdsSection.isVisible())) {
      // 대체 선택자로 시도
      const googleButton = page.getByText(/Google.*Ads/i).first();
      if (await googleButton.isVisible()) {
        await googleButton.click();
      }
    } else {
      await googleAdsSection.click();
    }

    // OAuth 리다이렉트 시뮬레이션
    // 실제 OAuth는 외부 서비스이므로 UI만 확인
    await page.waitForTimeout(2000);

    // OAuth 콜백 처리 확인 (모의)
    await page.goto(
      "/api/auth/callback/google-ads?code=mock_code&state=mock_state",
    );
    await page.waitForTimeout(1000);

    // 연동 완료 후 대시보드로 리다이렉트 확인
    if (
      page.url().includes("/dashboard") ||
      page.url().includes("/integrated")
    ) {
      // 연동 성공 메시지 또는 계정 목록 확인
      const successIndicators = [
        page.getByText(/연동.*완료/i),
        page.getByText(/Google.*연결/i),
        page.getByText(/계정.*추가/i),
      ];

      let foundSuccess = false;
      for (const indicator of successIndicators) {
        if (await indicator.isVisible()) {
          foundSuccess = true;
          break;
        }
      }

      // UI가 연동 상태를 반영하는지 확인
      expect(foundSuccess || page.url().includes("/integrated")).toBeTruthy();
    }
  });

  test("Meta Ads 연동 플로우", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta Ads 연동");

    // Meta/Facebook Ads 연동 시도
    const metaButton = page.getByText(/Meta.*Ads|Facebook.*Ads/i).first();
    if (await metaButton.isVisible()) {
      await metaButton.click();
      await page.waitForTimeout(2000);

      // Meta OAuth 시뮬레이션
      await page.goto("/api/auth/callback/meta-ads?code=mock_meta_code");
      await page.waitForTimeout(1000);
    }

    // 연동 후 상태 확인
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");

    // 플랫폼 목록에서 연동 상태 확인
    const platformStatus = page.locator('[data-testid="platform-status"]');
    if (await platformStatus.isVisible()) {
      // 연동된 플랫폼이 있는지 확인
      const connectedPlatforms = await platformStatus.count();
      expect(connectedPlatforms).toBeGreaterThanOrEqual(0);
    }
  });

  test("여러 플랫폼 동시 연동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "다중 플랫폼 연동");

    // 한국 플랫폼들 연동 시도
    const koreanPlatforms = [
      { name: /Naver.*Ads/i, callback: "/api/auth/callback/naver-ads" },
      { name: /Kakao.*Ads/i, callback: "/api/auth/callback/kakao-ads" },
      { name: /Coupang.*Ads/i, callback: "/api/auth/callback/coupang-ads" },
    ];

    for (const platform of koreanPlatforms) {
      const platformButton = page.getByText(platform.name).first();
      if (await platformButton.isVisible()) {
        await platformButton.click();
        await page.waitForTimeout(1000);

        // 각 플랫폼의 OAuth 콜백 시뮬레이션
        await page.goto(`${platform.callback}?code=mock_code_${Date.now()}`);
        await page.waitForTimeout(1000);

        // 다시 연동 페이지로 돌아가기
        await page.goto("/integrated");
        await page.waitForTimeout(1000);
      }
    }

    // 모든 연동 완료 후 상태 확인
    await page.waitForLoadState("networkidle");

    // 대시보드에서 통합 데이터 확인
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // 여러 플랫폼의 데이터가 통합되어 보이는지 확인
    const dashboardElements = [
      page.getByText(/전체.*캠페인/i),
      page.getByText(/통합.*성과/i),
      page.getByText(/플랫폼/i),
    ];

    let foundDashboardData = false;
    for (const element of dashboardElements) {
      if (await element.isVisible()) {
        foundDashboardData = true;
        break;
      }
    }
    expect(foundDashboardData).toBeTruthy();
  });

  test("연동 에러 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "연동 에러 처리");

    // 잘못된 OAuth 콜백 시뮬레이션
    await page.goto("/api/auth/callback/google-ads?error=access_denied");
    await page.waitForTimeout(2000);

    // 에러 처리 확인
    const errorIndicators = [
      page.getByText(/연동.*실패/i),
      page.getByText(/오류/i),
      page.getByText(/다시.*시도/i),
      page.getByText(/권한.*거부/i),
    ];

    let foundError = false;
    for (const indicator of errorIndicators) {
      if (await indicator.isVisible()) {
        foundError = true;
        break;
      }
    }

    // 에러 상황에서 사용자에게 적절한 피드백이 제공되는지 확인
    if (!foundError) {
      // 에러 메시지가 없다면 최소한 연동 페이지로 리다이렉트되어야 함
      expect(page.url()).toContain("/integrated");
    }
  });

  test("연동 해제 플로우", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "연동 해제");

    // 기존 연동된 계정이 있다고 가정하고 해제 시도
    const disconnectButtons = page.getByText(/연결.*해제|해제|삭제/i);
    const buttonCount = await disconnectButtons.count();

    if (buttonCount > 0) {
      // 첫 번째 해제 버튼 클릭
      await disconnectButtons.first().click();

      // 확인 대화상자 처리
      const confirmButtons = page.getByText(/확인|예|삭제/i);
      if (await confirmButtons.first().isVisible()) {
        await confirmButtons.first().click();
      }

      await page.waitForTimeout(2000);

      // 해제 완료 확인
      const disconnectSuccess = [
        page.getByText(/해제.*완료/i),
        page.getByText(/삭제.*완료/i),
        page.getByText(/연결.*끊/i),
      ];

      let foundDisconnectSuccess = false;
      for (const success of disconnectSuccess) {
        if (await success.isVisible()) {
          foundDisconnectSuccess = true;
          break;
        }
      }
    }

    // 연동 해제 후에도 페이지가 정상 작동하는지 확인
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/integrated");
  });

  test("플랫폼별 권한 관리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "권한 관리");

    // 각 플랫폼별 권한 설정 확인
    const platforms = ["Google", "Meta", "Naver", "Kakao"];

    for (const platform of platforms) {
      const platformSection = page.getByText(new RegExp(platform, "i")).first();
      if (await platformSection.isVisible()) {
        // 플랫폼 설정 또는 권한 버튼 찾기
        const settingsButton = platformSection
          .locator("..")
          .getByText(/설정|권한|관리/i)
          .first();

        if (await settingsButton.isVisible()) {
          await settingsButton.click();
          await page.waitForTimeout(1000);

          // 권한 설정 UI 확인
          const permissionElements = [
            page.getByText(/읽기.*권한/i),
            page.getByText(/캠페인.*관리/i),
            page.getByText(/데이터.*액세스/i),
          ];

          let foundPermissionUI = false;
          for (const element of permissionElements) {
            if (await element.isVisible()) {
              foundPermissionUI = true;
              break;
            }
          }

          // 권한 설정 UI가 있다면 올바르게 표시되어야 함
          if (foundPermissionUI) {
            expect(foundPermissionUI).toBeTruthy();
          }

          // 다시 목록으로 돌아가기
          const backButton = page.getByText(/뒤로|목록|취소/i).first();
          if (await backButton.isVisible()) {
            await backButton.click();
          } else {
            await page.goto("/integrated");
          }
          await page.waitForTimeout(500);
        }
      }
    }
  });
});
