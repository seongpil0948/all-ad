import { test, expect, AnnotationType } from "../tester";

test.describe("Platform Integration - New Authentication Methods", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(
      AnnotationType.MAIN_CATEGORY,
      "플랫폼 연동 - 신규 인증 방식",
    );
    // 설정 페이지의 플랫폼 연동 섹션으로 이동
    await page.goto("/settings");
  });

  test.describe("Google Ads MCC 인증", () => {
    test("MCC 계정 연동 프로세스", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google Ads MCC");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "MCC OAuth 연동");

      // Google Ads 연동 버튼 찾기
      const googleAdsCard = page.locator('[data-platform="google-ads"]');
      const connectButton = googleAdsCard.locator(
        'button:has-text("연동하기")',
      );

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // OAuth 설정 모달 표시 확인
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByText("Google Ads OAuth 설정")).toBeVisible();

        // MCC 계정 옵션 확인
        const mccOption = page.getByRole("checkbox", {
          name: "MCC(Manager Customer Center) 계정으로 연동",
        });

        if (await mccOption.isVisible()) {
          await mccOption.check();

          // MCC 관련 추가 필드 확인
          await expect(page.getByLabel("MCC Customer ID")).toBeVisible();
          await expect(
            page.getByText("최대 85,000개 계정 관리 가능"),
          ).toBeVisible();
        }

        // 필수 입력 필드 확인
        await expect(page.getByLabel("Client ID")).toBeVisible();
        await expect(page.getByLabel("Client Secret")).toBeVisible();
        await expect(page.getByLabel("Developer Token")).toBeVisible();
      }
    });

    test("MCC 클라이언트 계정 목록 확인", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google Ads MCC");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "클라이언트 계정 관리");

      // 연동된 MCC 계정이 있는 경우
      const connectedMCC = page.locator(
        '[data-platform="google-ads"][data-mcc="true"]',
      );

      if (await connectedMCC.isVisible()) {
        // 클라이언트 계정 보기 버튼
        const viewClientsButton = connectedMCC.locator(
          'button:has-text("클라이언트 계정 관리")',
        );

        if (await viewClientsButton.isVisible()) {
          await viewClientsButton.click();

          // 클라이언트 계정 목록 모달 확인
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(page.getByText("MCC 클라이언트 계정")).toBeVisible();

          // 계정 수 표시 확인
          await expect(page.getByText(/총 \d+개 계정/)).toBeVisible();

          // 계정 목록 테이블 확인
          await expect(page.getByRole("table")).toBeVisible();
          await expect(
            page.getByRole("columnheader", { name: "계정 ID" }),
          ).toBeVisible();
          await expect(
            page.getByRole("columnheader", { name: "계정 이름" }),
          ).toBeVisible();
          await expect(
            page.getByRole("columnheader", { name: "상태" }),
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Meta System Users 인증", () => {
    test("System User 연동 프로세스", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta System Users");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "영구 토큰 설정");

      const metaAdsCard = page.locator('[data-platform="meta-ads"]');
      const connectButton = metaAdsCard.locator('button:has-text("연동하기")');

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // OAuth 설정 모달 확인
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByText("Meta Ads OAuth 설정")).toBeVisible();

        // System User 옵션 확인
        const systemUserOption = page.getByRole("checkbox", {
          name: "System User 토큰 사용 (영구 토큰)",
        });

        if (await systemUserOption.isVisible()) {
          await systemUserOption.check();

          // System User 관련 필드 확인
          await expect(
            page.getByLabel("System User Access Token"),
          ).toBeVisible();
          await expect(page.getByText("토큰 만료 없음")).toBeVisible();
          await expect(
            page.getByText("비즈니스 관리자에서 발급"),
          ).toBeVisible();
        }

        // 일반 OAuth와의 차이점 안내 확인
        await expect(
          page.getByText(/일반 사용자 토큰: 60일 만료/),
        ).toBeVisible();
        await expect(page.getByText(/System User: 만료 없음/)).toBeVisible();
      }
    });

    test("System User 권한 확인", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta System Users");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "권한 체크");

      // 연동된 System User가 있는 경우
      const connectedSystemUser = page.locator(
        '[data-platform="meta-ads"][data-system-user="true"]',
      );

      if (await connectedSystemUser.isVisible()) {
        // 권한 확인 버튼
        const checkPermissionsButton = connectedSystemUser.locator(
          'button:has-text("권한 확인")',
        );

        if (await checkPermissionsButton.isVisible()) {
          await checkPermissionsButton.click();

          // 권한 목록 모달 확인
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(page.getByText("System User 권한")).toBeVisible();

          // 필수 권한 확인
          const requiredPermissions = [
            "ads_management",
            "ads_read",
            "business_management",
            "pages_read_engagement",
          ];

          for (const permission of requiredPermissions) {
            await expect(page.getByText(permission)).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("TikTok Business Center 인증", () => {
    test("Business Center 연동 프로세스", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok Business Center");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "Business Center 연동");

      const tiktokAdsCard = page.locator('[data-platform="tiktok-ads"]');
      const connectButton = tiktokAdsCard.locator(
        'button:has-text("연동하기")',
      );

      if (await connectButton.isVisible()) {
        await connectButton.click();

        // Business Center 설정 모달 확인
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByText("TikTok Ads 설정")).toBeVisible();

        // Business Center 옵션 확인
        const bcOption = page.getByRole("checkbox", {
          name: "Business Center로 연동",
        });

        if (await bcOption.isVisible()) {
          await bcOption.check();

          // Business Center 관련 필드 확인
          await expect(page.getByLabel("Business Center ID")).toBeVisible();
          await expect(page.getByLabel("Access Token")).toBeVisible();
          await expect(page.getByText("최대 4,000명 멤버 관리")).toBeVisible();
        }
      }
    });

    test("QR 코드 온보딩 기능", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok Business Center");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "QR 코드 온보딩");

      // 연동된 Business Center가 있는 경우
      const connectedBC = page.locator(
        '[data-platform="tiktok-ads"][data-business-center="true"]',
      );

      if (await connectedBC.isVisible()) {
        // QR 코드 생성 버튼
        const generateQRButton = connectedBC.locator(
          'button:has-text("QR 코드 생성")',
        );

        if (await generateQRButton.isVisible()) {
          await generateQRButton.click();

          // QR 코드 모달 확인
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(
            page.getByText("클라이언트 온보딩 QR 코드"),
          ).toBeVisible();

          // QR 코드 이미지 확인
          await expect(
            page.locator('[data-testid="qr-code-image"]'),
          ).toBeVisible();

          // 만료 시간 표시 확인
          await expect(page.getByText(/유효기간: 7일/)).toBeVisible();

          // 권한 설정 확인
          await expect(
            page.getByText("광고 계정 읽기/쓰기 권한"),
          ).toBeVisible();
        }
      }
    });

    test("Business Center 멤버 관리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok Business Center");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "멤버 관리");

      // 연동된 Business Center가 있는 경우
      const connectedBC = page.locator(
        '[data-platform="tiktok-ads"][data-business-center="true"]',
      );

      if (await connectedBC.isVisible()) {
        // 멤버 관리 버튼
        const manageMembersButton = connectedBC.locator(
          'button:has-text("멤버 관리")',
        );

        if (await manageMembersButton.isVisible()) {
          await manageMembersButton.click();

          // 멤버 목록 모달 확인
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(page.getByText("Business Center 멤버")).toBeVisible();

          // 멤버 수 표시 확인
          await expect(page.getByText(/총 \d+명/)).toBeVisible();

          // Enterprise 기능 확인 (1000명 이상인 경우)
          const memberCountText = await page
            .getByText(/총 (\d+)명/)
            .textContent();
          const memberCount = parseInt(
            memberCountText?.match(/\d+/)?.[0] || "0",
          );

          if (memberCount > 1000) {
            await expect(
              page.getByText("Enterprise Business Center"),
            ).toBeVisible();
          }
        }
      }
    });
  });

  test.describe("토큰 갱신 및 관리", () => {
    test("자동 토큰 갱신 상태 확인", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "토큰 관리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동 갱신");

      // 연동된 플랫폼들의 토큰 상태 확인
      const connectedPlatforms = page.locator('[data-connected="true"]');
      const count = await connectedPlatforms.count();

      for (let i = 0; i < count; i++) {
        const platform = connectedPlatforms.nth(i);
        const tokenStatus = platform.locator('[data-testid="token-status"]');

        if (await tokenStatus.isVisible()) {
          // 토큰 상태 아이콘 확인
          const statusIcon = tokenStatus.locator('[data-testid="status-icon"]');
          await expect(statusIcon).toBeVisible();

          // 플랫폼별 토큰 정보 확인
          const platformName = await platform.getAttribute("data-platform");

          switch (platformName) {
            case "google-ads":
              // Google은 refresh token으로 자동 갱신
              await expect(tokenStatus).toContainText(/자동 갱신/);
              break;
            case "meta-ads":
              const isSystemUser =
                await platform.getAttribute("data-system-user");
              if (isSystemUser === "true") {
                await expect(tokenStatus).toContainText(/영구 토큰/);
              } else {
                await expect(tokenStatus).toContainText(/만료: \d+일/);
              }
              break;
            case "tiktok-ads":
              // TikTok은 24시간마다 갱신 필요
              await expect(tokenStatus).toContainText(/24시간 갱신/);
              break;
          }
        }
      }
    });

    test("수동 토큰 갱신", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "토큰 관리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "수동 갱신");

      // 토큰 갱신이 필요한 플랫폼 찾기
      const platformNeedingRefresh = page
        .locator('[data-token-expired="true"], [data-token-expiring="true"]')
        .first();

      if (await platformNeedingRefresh.isVisible()) {
        const refreshButton = platformNeedingRefresh.locator(
          'button:has-text("토큰 갱신")',
        );

        if (await refreshButton.isVisible()) {
          await refreshButton.click();

          // 갱신 진행 상태 확인
          await expect(
            platformNeedingRefresh.locator('[data-testid="refresh-spinner"]'),
          ).toBeVisible();

          // 갱신 완료 메시지 확인 (최대 10초 대기)
          await expect(page.getByText("토큰이 갱신되었습니다")).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });
  });

  test.describe("멀티 계정 관리", () => {
    test("플랫폼별 멀티 계정 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "멀티 계정");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "계정 목록");

      // 멀티 계정이 설정된 플랫폼 확인
      const multiAccountPlatforms = page.locator('[data-multi-account="true"]');
      const count = await multiAccountPlatforms.count();

      for (let i = 0; i < count; i++) {
        const platform = multiAccountPlatforms.nth(i);

        // 계정 수 표시 확인
        await expect(
          platform.locator('[data-testid="account-count"]'),
        ).toBeVisible();

        // 계정 목록 보기 버튼
        const viewAccountsButton = platform.locator(
          'button:has-text("계정 목록")',
        );

        if (await viewAccountsButton.isVisible()) {
          await viewAccountsButton.click();

          // 계정 목록 모달 확인
          await expect(page.getByRole("dialog")).toBeVisible();

          // 계정 테이블 확인
          await expect(page.getByRole("table")).toBeVisible();

          // 모달 닫기
          await page.getByRole("button", { name: "닫기" }).click();
        }
      }
    });
  });
});
