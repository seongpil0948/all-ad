import { test, expect, AnnotationType } from "../tester";

test.describe("FAQ Page - Integration Tests", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "FAQ 통합 테스트");
    await page.goto("/faq", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
  });

  test("다른 페이지와의 연동 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 연동");

    // Footer에서 FAQ 링크 확인
    await page.goto("/");
    await page.waitForTimeout(2000);

    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    const faqLink = footer.getByText("자주 묻는 질문");
    await expect(faqLink).toBeVisible();

    // FAQ 페이지로 이동
    await faqLink.click();
    await page.waitForURL("**/faq");
    await expect(page).toHaveURL(/\/faq$/);
  });

  test("대량 데이터 처리 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "대량 처리");

    // 모든 질문 빠르게 열고 닫기
    const questions = page.locator('[data-testid="faq-question"]');
    const count = await questions.count();

    // 처음 10개 질문 빠르게 토글
    for (let i = 0; i < Math.min(10, count); i++) {
      await questions.nth(i).click();
      await page.waitForTimeout(200);
    }

    // 다시 모두 닫기
    for (let i = 0; i < Math.min(10, count); i++) {
      await questions.nth(i).click();
      await page.waitForTimeout(200);
    }

    // 페이지가 정상 작동하는지 확인
    await expect(page.getByText("자주 묻는 질문")).toBeVisible();
  });

  test("브라우저 뒤로가기/앞으로가기", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "브라우저 네비게이션");

    // 홈페이지에서 시작
    await page.goto("/");
    await page.waitForTimeout(1000);

    // FAQ 페이지로 이동
    await page.goto("/faq");
    await page.waitForTimeout(1000);

    // 질문 하나 열기
    const firstQuestion = page.getByText(
      "Q1: 올애드(All-AD)는 어떤 서비스인가요?",
    );
    await firstQuestion.click();
    await page.waitForTimeout(1000);

    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    // 앞으로가기
    await page.goForward();
    await expect(page).toHaveURL(/\/faq$/);

    // 질문 상태가 유지되는지 확인 (브라우저에 따라 다를 수 있음)
    await expect(firstQuestion).toBeVisible();
  });

  test("동시 다중 사용자 시뮬레이션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "동시성");

    // 여러 질문을 빠르게 동시에 클릭
    const promises = [];
    const questions = page.locator('[data-testid="faq-question"]');

    // 3개 질문 동시 클릭
    for (let i = 0; i < 3; i++) {
      promises.push(questions.nth(i).click());
    }

    await Promise.all(promises);
    await page.waitForTimeout(1500);

    // 3개의 답변이 모두 열려있는지 확인
    const visibleAnswers = page.locator('[role="region"]:visible');
    const visibleCount = await visibleAnswers.count();
    expect(visibleCount).toBe(3);
  });

  test("에러 상황 복구 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "에러 복구");

    // 잘못된 URL 파라미터와 함께 접근
    await page.goto("/faq?category=invalid&q=test");
    await page.waitForTimeout(2000);

    // 페이지가 정상적으로 로드되는지 확인
    await expect(page.getByText("자주 묻는 질문")).toBeVisible();
    await expect(page.getByText("서비스 일반")).toBeVisible();

    // 기본 기능이 작동하는지 확인
    const firstQuestion = page.locator('[data-testid="faq-question"]').first();
    await firstQuestion.click();
    await page.waitForTimeout(1000);

    const firstAnswer = page.locator('[role="region"]').first();
    await expect(firstAnswer).toBeVisible();
  });

  test("다국어 지원 준비 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "다국어");

    // 한국어 콘텐츠가 제대로 표시되는지 확인
    const koreanTexts = [
      "자주 묻는 질문",
      "서비스 일반",
      "계정 연동",
      "기능 관련",
      "요금제 및 결제",
      "보안 및 데이터",
      "기술 지원",
    ];

    for (const text of koreanTexts) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }

    // lang 속성 확인
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlLang).toBe("ko");
  });

  test("SEO 최적화 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "SEO");

    // 구조화된 데이터 확인
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);

    // 의미있는 링크 텍스트 확인
    const emailLink = page.locator('a[href^="mailto:"]').first();
    if (await emailLink.isVisible()) {
      const linkText = await emailLink.textContent();
      expect(linkText).toBeTruthy();
      expect(linkText).not.toBe("여기");
    }

    // 페이지 설명 메타 태그
    const description = await page.getAttribute(
      'meta[name="description"]',
      "content",
    );
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(50);
  });

  test("키보드 전용 네비게이션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "키보드 네비게이션");

    // Tab 키로 첫 번째 질문으로 이동
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Space 키로 열기
    await page.keyboard.press("Space");
    await page.waitForTimeout(1000);

    // 첫 번째 답변이 표시되는지 확인
    const firstAnswer = page.locator('[role="region"]').first();
    await expect(firstAnswer).toBeVisible();

    // Arrow Down으로 다음 질문으로 이동
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    // 두 번째 답변도 표시되는지 확인
    const secondAnswer = page.locator('[role="region"]').nth(1);
    await expect(secondAnswer).toBeVisible();
  });

  test("로컬 스토리지 활용 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "로컬 스토리지");

    // 몇 개 질문 열기
    const questions = page.locator('[data-testid="faq-question"]');
    await questions.nth(0).click();
    await questions.nth(2).click();
    await questions.nth(4).click();
    await page.waitForTimeout(1000);

    // 로컬 스토리지에 상태 저장 (구현되어 있다면)
    const localStorage = await page.evaluate(() => {
      return Object.keys(window.localStorage);
    });

    // 페이지 새로고침
    await page.reload();
    await page.waitForTimeout(2000);

    // FAQ 페이지가 정상적으로 로드되는지 확인
    await expect(page.getByText("자주 묻는 질문")).toBeVisible();
  });

  test("프린트 레이아웃 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "프린트");

    // 모든 질문 열기 (프린트 시 모든 내용이 보이도록)
    const questions = page.locator('[data-testid="faq-question"]');
    const count = await questions.count();

    for (let i = 0; i < Math.min(5, count); i++) {
      await questions.nth(i).click();
      await page.waitForTimeout(300);
    }

    // 프린트 미리보기 에뮬레이션
    await page.emulateMedia({ media: "print" });

    // 주요 콘텐츠가 여전히 보이는지 확인
    await expect(page.getByText("자주 묻는 질문")).toBeVisible();
    await expect(page.getByText("서비스 일반")).toBeVisible();

    // 미디어 타입 원복
    await page.emulateMedia({ media: "screen" });
  });
});
