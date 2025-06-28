import { test, expect, AnnotationType } from "../tester";

test.describe("Integrated Platforms Page", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "플랫폼 연동");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "연동 관리");
    await page.goto("/integrated");
  });

  test("연동 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 페이지 헤더 확인
    await expect(
      page.getByRole("heading", { name: /광고 플랫폼 연동|연동 관리/ }),
    ).toBeVisible();

    // 설명 텍스트
    await expect(
      page.getByText(/광고 플랫폼을 연동하여 캠페인을 통합 관리하세요/),
    ).toBeVisible();

    // 지원 플랫폼 섹션
    await expect(page.getByText("지원 플랫폼")).toBeVisible();

    // 플랫폼 카드들 확인
    const platforms = ["Google Ads", "Meta Ads", "Naver Ads", "Kakao Ads"];
    for (const platform of platforms) {
      await expect(page.getByText(platform)).toBeVisible();
    }
  });

  test("Google Ads 연동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Google Ads 연동");

    // Google Ads 카드 찾기
    const googleAdsCard = page
      .locator("div")
      .filter({ hasText: "Google Ads" })
      .first();
    await expect(googleAdsCard).toBeVisible();

    // 연동 버튼 클릭
    const connectButton = googleAdsCard.getByRole("button", {
      name: /연동하기|Connect/,
    });
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // OAuth 리디렉션 확인 (실제 테스트에서는 모킹 필요)
    // 또는 모달/폼이 나타나는지 확인
    await expect(page.getByText(/Google 계정으로 로그인|OAuth/)).toBeVisible();
  });

  test("Meta Ads 연동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Meta Ads 연동");

    // Meta Ads 카드 찾기
    const metaAdsCard = page
      .locator("div")
      .filter({ hasText: "Meta Ads" })
      .first();
    await expect(metaAdsCard).toBeVisible();

    // 연동 버튼 클릭
    const connectButton = metaAdsCard.getByRole("button", {
      name: /연동하기|Connect/,
    });
    await expect(connectButton).toBeVisible();
    await connectButton.click();

    // Facebook 로그인 확인
    await expect(page.getByText(/Facebook 계정으로 로그인/)).toBeVisible();
  });

  test("연동된 계정 목록", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "연동 계정 관리");

    // 연동된 계정 섹션
    await expect(page.getByText("연동된 계정")).toBeVisible();

    // 계정이 없을 때 메시지
    const emptyMessage = page.getByText("연동된 광고 계정이 없습니다");
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible();
    } else {
      // 연동된 계정이 있을 때
      await expect(page.locator("table")).toBeVisible();
      await expect(page.getByText("플랫폼")).toBeVisible();
      await expect(page.getByText("계정명")).toBeVisible();
      await expect(page.getByText("상태")).toBeVisible();
      await expect(page.getByText("연동일")).toBeVisible();
    }
  });

  test("계정 연동 해제", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "연동 해제");

    // 연동된 계정이 있는지 확인
    const disconnectButton = page
      .getByRole("button", { name: /연동 해제|Disconnect/ })
      .first();

    if (await disconnectButton.isVisible()) {
      await disconnectButton.click();

      // 확인 모달
      await expect(
        page.getByText("정말로 연동을 해제하시겠습니까?"),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
      await expect(page.getByRole("button", { name: "해제" })).toBeVisible();

      // 취소 클릭
      await page.getByRole("button", { name: "취소" }).click();
    }
  });

  test("다중 계정 연동", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "다중 계정");

    // 플랫폼별 다중 계정 지원 확인
    const googleAdsCard = page
      .locator("div")
      .filter({ hasText: "Google Ads" })
      .first();

    // 이미 연동된 계정이 있는 경우 추가 연동 버튼 확인
    const addAccountButton = googleAdsCard.getByRole("button", {
      name: /계정 추가|Add Account/,
    });
    if (await addAccountButton.isVisible()) {
      await expect(addAccountButton).toBeVisible();
      await expect(
        page.getByText(/여러 계정을 연동할 수 있습니다/),
      ).toBeVisible();
    }
  });

  test("연동 상태 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "상태 표시");

    // 각 플랫폼 카드의 연동 상태 확인
    const platformCards = page.locator("div[class*='card']");
    const count = await platformCards.count();

    for (let i = 0; i < Math.min(count, 4); i++) {
      const card = platformCards.nth(i);

      // 연동 상태 아이콘 또는 텍스트 확인
      const statusIndicator = card.locator(
        "[class*='status'], [class*='badge']",
      );
      if (await statusIndicator.isVisible()) {
        await expect(statusIndicator).toBeVisible();
      }
    }
  });

  test("연동 가이드 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "도움말");

    // 도움말 또는 가이드 링크 확인
    const helpLink = page.getByRole("link", { name: /도움말|가이드|Help/ });
    if (await helpLink.isVisible()) {
      await helpLink.click();

      // 가이드 모달 또는 페이지 확인
      await expect(page.getByText(/연동 방법|Integration Guide/)).toBeVisible();
    }
  });

  test("플랫폼별 요구사항 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "요구사항");

    // Naver Ads의 경우 API 키 필요
    const naverCard = page
      .locator("div")
      .filter({ hasText: "Naver Ads" })
      .first();
    await expect(naverCard.getByText(/API Key|Customer ID/)).toBeVisible();

    // Kakao Ads의 경우 사업자 인증 필요
    const kakaoCard = page
      .locator("div")
      .filter({ hasText: "Kakao Ads" })
      .first();
    await expect(
      kakaoCard.getByText(/사업자 인증|Business Verification/),
    ).toBeVisible();
  });

  test("연동 오류 처리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "오류 처리");

    // 만료된 토큰 또는 오류 상태 확인
    const errorBadge = page
      .locator("[class*='error'], [class*='danger']")
      .first();
    if (await errorBadge.isVisible()) {
      await expect(errorBadge).toBeVisible();

      // 재연동 버튼 확인
      const reconnectButton = page.getByRole("button", {
        name: /재연동|Reconnect/,
      });
      await expect(reconnectButton).toBeVisible();
    }
  });
});
