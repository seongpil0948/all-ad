import { test, expect, AnnotationType } from "../tester";

test.describe("Platform Integration Components", () => {
  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "컴포넌트");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "플랫폼 연동");
  });

  test.describe("PlatformCredentialForm", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/integrated");
    });

    test("네이버 광고 API 키 입력 폼", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "네이버 폼");

      // 네이버 광고 카드 찾기
      const naverCard = page
        .locator("div")
        .filter({ hasText: "Naver Ads" })
        .first();
      const connectButton = naverCard.getByRole("button", {
        name: /연동하기|Connect/,
      });

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // API 키 입력 폼 확인
        await expect(page.getByLabel("Customer ID")).toBeVisible();
        await expect(page.getByLabel("API Key")).toBeVisible();
        await expect(page.getByLabel("API Secret")).toBeVisible();

        // 필수 필드 표시
        const customerIdInput = page.getByLabel("Customer ID");
        await expect(customerIdInput).toHaveAttribute("required", "");
      }
    });

    test("카카오 광고 사업자 인증", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "카카오 폼");

      // 카카오 광고 카드 찾기
      const kakaoCard = page
        .locator("div")
        .filter({ hasText: "Kakao Ads" })
        .first();
      const connectButton = kakaoCard.getByRole("button", {
        name: /연동하기|Connect/,
      });

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // 사업자 인증 안내 확인
        await expect(page.getByText(/사업자 인증이 필요합니다/)).toBeVisible();
        await expect(page.getByText(/공식 파트너사를 통해/)).toBeVisible();
      }
    });

    test("폼 유효성 검증", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

      // 네이버 광고 폼 열기
      const naverCard = page
        .locator("div")
        .filter({ hasText: "Naver Ads" })
        .first();
      const connectButton = naverCard.getByRole("button", {
        name: /연동하기|Connect/,
      });

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // 빈 폼 제출 시도
        const submitButton = page.getByRole("button", { name: "연동" });
        await submitButton.click();

        // 에러 메시지 확인
        await expect(page.getByText(/필수 항목입니다/)).toBeVisible();
      }
    });
  });

  test.describe("MultiAccountPlatformManager", () => {
    test("다중 계정 목록 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "다중 계정");

      await page.goto("/integrated");

      // 이미 연동된 계정이 있는 경우
      const accountList = page.locator("[class*='account-list']");
      if (await accountList.isVisible()) {
        // 계정 정보 표시 확인
        await expect(
          accountList.locator("[class*='account-name']").first(),
        ).toBeVisible();
        await expect(
          accountList.locator("[class*='account-status']").first(),
        ).toBeVisible();

        // 계정 추가 버튼
        await expect(
          page.getByRole("button", { name: /계정 추가/ }),
        ).toBeVisible();
      }
    });

    test("계정 상태 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "계정 상태");

      await page.goto("/integrated");

      // 계정 상태 배지들
      const statusBadges = page.locator(
        "[class*='status-badge'], [class*='account-status']",
      );

      if (await statusBadges.first().isVisible()) {
        const count = await statusBadges.count();

        for (let i = 0; i < Math.min(count, 3); i++) {
          const badge = statusBadges.nth(i);
          const text = await badge.textContent();

          // 가능한 상태들: 활성, 비활성, 만료, 오류
          expect(text).toMatch(
            /활성|비활성|만료|오류|Active|Inactive|Expired|Error/,
          );
        }
      }
    });

    test("계정 삭제 확인", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "계정 삭제");

      await page.goto("/integrated");

      // 삭제 버튼 찾기
      const deleteButton = page
        .getByRole("button", { name: /삭제|Remove/ })
        .first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 확인 모달
        await expect(
          page.getByText(/정말로 이 계정을 삭제하시겠습니까?/),
        ).toBeVisible();
        await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
        await expect(page.getByRole("button", { name: "삭제" })).toBeVisible();

        // 취소 클릭
        await page.getByRole("button", { name: "취소" }).click();
      }
    });
  });

  test.describe("PlatformCredentialItem", () => {
    test("자격 증명 항목 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자격 증명 표시");

      await page.goto("/integrated");

      // 자격 증명 항목 확인
      const credentialItems = page.locator("[class*='credential-item']");

      if (await credentialItems.first().isVisible()) {
        const firstItem = credentialItems.first();

        // 기본 정보 표시
        await expect(
          firstItem.locator("[class*='platform-name']"),
        ).toBeVisible();
        await expect(firstItem.locator("[class*='account-id']")).toBeVisible();
        await expect(
          firstItem.locator("[class*='created-date']"),
        ).toBeVisible();

        // 액션 버튼들
        await expect(firstItem.locator("button").first()).toBeVisible();
      }
    });

    test("토큰 갱신 필요 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "토큰 갱신");

      await page.goto("/integrated");

      // 갱신 필요 알림
      const refreshAlert = page.locator(
        "[class*='refresh-needed'], [class*='token-expired']",
      );

      if (await refreshAlert.first().isVisible()) {
        await expect(
          refreshAlert.getByText(/토큰 갱신|갱신 필요|Refresh needed/),
        ).toBeVisible();

        // 갱신 버튼
        const refreshButton = page.getByRole("button", {
          name: /갱신|Refresh/,
        });
        await expect(refreshButton).toBeVisible();
      }
    });
  });

  test.describe("GoogleAdsSimpleConnect", () => {
    test("간편 연동 버튼", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "Google 간편 연동");

      await page.goto("/integrated");

      // Google Ads 카드 찾기
      const googleCard = page
        .locator("div")
        .filter({ hasText: "Google Ads" })
        .first();
      const connectButton = googleCard.getByRole("button", {
        name: /Google로 로그인|Sign in with Google/,
      });

      if (await connectButton.isVisible()) {
        await expect(connectButton).toBeVisible();

        // 버튼에 Google 아이콘이 있는지 확인
        await expect(
          connectButton.locator("svg, img[alt*='Google']"),
        ).toBeVisible();
      }
    });

    test("연동 프로세스 안내", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "연동 안내");

      await page.goto("/integrated");

      // Google Ads 카드의 안내 텍스트
      const googleCard = page
        .locator("div")
        .filter({ hasText: "Google Ads" })
        .first();

      await expect(
        googleCard.getByText(/간편하게 연동|Easy integration/),
      ).toBeVisible();
      await expect(googleCard.getByText(/권한 승인|Authorize/)).toBeVisible();
    });
  });

  test.describe("CoupangManualCampaignManager", () => {
    test("쿠팡 수동 입력 폼", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "쿠팡 수동 입력");

      await page.goto("/integrated");

      // 쿠팡 카드 찾기
      const coupangCard = page
        .locator("div")
        .filter({ hasText: "Coupang" })
        .first();

      if (await coupangCard.isVisible()) {
        // 수동 입력 안내
        await expect(
          coupangCard.getByText(/수동 입력|Manual entry/),
        ).toBeVisible();
        await expect(coupangCard.getByText(/API 미지원|No API/)).toBeVisible();

        // 수동 입력 버튼
        const manualButton = coupangCard.getByRole("button", {
          name: /수동 입력|Manual/,
        });
        if (await manualButton.isVisible()) {
          await manualButton.click();

          // 수동 입력 폼
          await expect(page.getByLabel("캠페인명")).toBeVisible();
          await expect(page.getByLabel("일일 예산")).toBeVisible();
          await expect(page.getByLabel("클릭수")).toBeVisible();
          await expect(page.getByLabel("노출수")).toBeVisible();
        }
      }
    });

    test("수동 데이터 저장", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "데이터 저장");

      await page.goto("/integrated");

      const coupangCard = page
        .locator("div")
        .filter({ hasText: "Coupang" })
        .first();
      const manualButton = coupangCard.getByRole("button", {
        name: /수동 입력|Manual/,
      });

      if (await manualButton.isVisible()) {
        await manualButton.click();

        // 폼 입력
        await page.getByLabel("캠페인명").fill("테스트 캠페인");
        await page.getByLabel("일일 예산").fill("50000");
        await page.getByLabel("클릭수").fill("1000");
        await page.getByLabel("노출수").fill("50000");

        // 저장 버튼
        await page.getByRole("button", { name: "저장" }).click();

        // 성공 메시지
        await expect(
          page.getByText(/저장되었습니다|Saved successfully/),
        ).toBeVisible();
      }
    });
  });

  test.describe("Platform Integration State", () => {
    test("전체 연동 상태 대시보드", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "연동 대시보드");

      await page.goto("/integrated");

      // 연동 요약 정보
      const summary = page.locator("[class*='integration-summary']");
      if (await summary.isVisible()) {
        await expect(
          summary.getByText(/연동된 플랫폼|Connected platforms/),
        ).toBeVisible();
        await expect(summary.getByText(/\d+개/)).toBeVisible();
      }

      // 빠른 연동 버튼들
      await expect(
        page.getByRole("button", { name: /모두 연동|Connect all/ }),
      ).toBeVisible();
    });

    test("플랫폼별 데이터 동기화 상태", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "동기화 상태");

      await page.goto("/integrated");

      // 동기화 상태 표시
      const syncStatus = page.locator("[class*='sync-status']");

      if (await syncStatus.first().isVisible()) {
        const count = await syncStatus.count();

        for (let i = 0; i < Math.min(count, 3); i++) {
          const status = syncStatus.nth(i);

          // 마지막 동기화 시간
          await expect(status.locator("[class*='last-sync']")).toBeVisible();

          // 동기화 버튼
          const syncButton = status
            .locator("button")
            .filter({ hasText: /동기화|Sync/ });
          if (await syncButton.isVisible()) {
            await expect(syncButton).toBeVisible();
          }
        }
      }
    });
  });
});
