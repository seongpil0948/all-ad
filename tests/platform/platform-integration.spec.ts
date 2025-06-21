import { test, expect, AnnotationType } from "../tester";

test.describe("Platform Integration", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "플랫폼 연동");
    // 설정 페이지의 플랫폼 연동 섹션으로 이동
    await page.goto("/settings");
  });

  test("플랫폼 연동 섹션 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "연동 UI");

    // 플랫폼 연동 섹션 확인
    await expect(
      page.getByRole("heading", { name: "플랫폼 연동" }),
    ).toBeVisible();

    // 지원되는 플랫폼 목록 확인
    const platforms = [
      "Google Ads",
      "Facebook Ads",
      "Naver Ads",
      "Kakao Ads",
      "Coupang Ads",
    ];

    for (const platform of platforms) {
      await expect(page.getByText(platform)).toBeVisible();
    }
  });

  test("Google Ads 연동 프로세스", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google Ads");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth 연동");

    // Google Ads 연동 버튼 찾기
    const googleAdsCard = page.locator('[data-platform="google-ads"]');
    const connectButton = googleAdsCard.locator('button:has-text("연동하기")');

    if (await connectButton.isVisible()) {
      // 연동 버튼 클릭
      await connectButton.click();

      // OAuth 설정 모달 표시 확인
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Google Ads OAuth 설정")).toBeVisible();

      // 필수 입력 필드 확인
      await expect(page.getByLabel("Client ID")).toBeVisible();
      await expect(page.getByLabel("Client Secret")).toBeVisible();
      await expect(page.getByLabel("Developer Token")).toBeVisible();

      // 리디렉션 URI 표시 확인
      await expect(page.getByText(/redirect_uri/i)).toBeVisible();

      // 취소 버튼 클릭
      await page.getByRole("button", { name: "취소" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("Facebook Ads 연동 프로세스", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Facebook Ads");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth 연동");

    const facebookAdsCard = page.locator('[data-platform="facebook-ads"]');
    const connectButton = facebookAdsCard.locator(
      'button:has-text("연동하기")',
    );

    if (await connectButton.isVisible()) {
      await connectButton.click();

      // OAuth 설정 모달 확인
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Facebook Ads OAuth 설정")).toBeVisible();

      // 필수 입력 필드 확인
      await expect(page.getByLabel("App ID")).toBeVisible();
      await expect(page.getByLabel("App Secret")).toBeVisible();

      // 수동 토큰 입력 옵션 확인
      const manualTokenCheckbox = page.getByRole("checkbox", {
        name: "수동으로 토큰 입력",
      });
      if (await manualTokenCheckbox.isVisible()) {
        await manualTokenCheckbox.check();
        await expect(page.getByLabel("Access Token")).toBeVisible();
      }
    }
  });

  test("Naver Ads API 키 연동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Naver Ads");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "API 키 연동");

    const naverAdsCard = page.locator('[data-platform="naver-ads"]');
    const connectButton = naverAdsCard.locator('button:has-text("연동하기")');

    if (await connectButton.isVisible()) {
      await connectButton.click();

      // API 키 입력 모달 확인
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText("Naver Ads API 설정")).toBeVisible();

      // 필수 입력 필드 확인
      await expect(page.getByLabel("API Key")).toBeVisible();
      await expect(page.getByLabel("API Secret")).toBeVisible();
      await expect(page.getByLabel("Customer ID")).toBeVisible();
    }
  });

  test("Coupang Ads 수동 관리 설정", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Coupang Ads");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "수동 관리");

    const coupangAdsCard = page.locator('[data-platform="coupang-ads"]');
    const manageButton = coupangAdsCard.locator('button:has-text("수동 관리")');

    if (await manageButton.isVisible()) {
      // Coupang은 API가 없으므로 수동 관리 안내 표시
      await expect(coupangAdsCard).toContainText("API 미지원");
      await expect(coupangAdsCard).toContainText(
        "수동으로 캠페인 데이터를 입력",
      );

      // 수동 관리 버튼 클릭
      await manageButton.click();

      // 수동 캠페인 관리 페이지로 이동 확인
      await expect(page).toHaveURL(/\/integrated.*coupang/);
    }
  });

  test("연동된 플랫폼 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "연동 상태");

    // 연동된 플랫폼 카드 확인
    const connectedPlatforms = page.locator('[data-connected="true"]');
    const count = await connectedPlatforms.count();

    if (count > 0) {
      // 연동된 플랫폼의 상태 확인
      for (let i = 0; i < count; i++) {
        const platformCard = connectedPlatforms.nth(i);

        // 연동 상태 아이콘
        await expect(
          platformCard.locator('[data-testid="connected-icon"]'),
        ).toBeVisible();

        // 연동 해제 버튼
        await expect(
          platformCard.locator('button:has-text("연동 해제")'),
        ).toBeVisible();

        // 마지막 동기화 시간
        await expect(
          platformCard.locator('[data-testid="last-sync-time"]'),
        ).toBeVisible();
      }
    }
  });

  test("플랫폼 연동 해제", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "연동 해제");

    // 연동된 플랫폼 찾기
    const connectedPlatform = page.locator('[data-connected="true"]').first();

    if (await connectedPlatform.isVisible()) {
      const disconnectButton = connectedPlatform.locator(
        'button:has-text("연동 해제")',
      );

      // 연동 해제 버튼 클릭
      await disconnectButton.click();

      // 확인 다이얼로그 표시
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByText("정말로 연동을 해제하시겠습니까?"),
      ).toBeVisible();

      // 취소 클릭
      await page.getByRole("button", { name: "취소" }).click();

      // 다이얼로그 닫힘 확인
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("OAuth 콜백 URL 복사 기능", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "OAuth 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "콜백 URL");

    // Google Ads 연동 모달 열기
    const googleAdsCard = page.locator('[data-platform="google-ads"]');
    const connectButton = googleAdsCard.locator('button:has-text("연동하기")');

    if (await connectButton.isVisible()) {
      await connectButton.click();

      // 리디렉션 URI 복사 버튼 찾기
      const copyButton = page.locator('[data-testid="copy-redirect-uri"]');

      if (await copyButton.isVisible()) {
        // 복사 버튼 클릭
        await copyButton.click();

        // 복사 성공 메시지 확인
        await expect(page.getByText("복사되었습니다")).toBeVisible();
      }
    }
  });

  test("API 가이드 링크", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "도움말");

    // 각 플랫폼의 API 가이드 링크 확인
    const platforms = [
      { name: "google-ads", guide: "Google Ads API 설정 가이드" },
      { name: "facebook-ads", guide: "Facebook Ads API 설정 가이드" },
      { name: "naver-ads", guide: "Naver Ads API 설정 가이드" },
      { name: "kakao-ads", guide: "Kakao Ads API 설정 가이드" },
    ];

    for (const platform of platforms) {
      const platformCard = page.locator(`[data-platform="${platform.name}"]`);
      const guideLink = platformCard.locator(`a:has-text("${platform.guide}")`);

      if (await guideLink.isVisible()) {
        await expect(guideLink).toHaveAttribute("target", "_blank");
      }
    }
  });
});
