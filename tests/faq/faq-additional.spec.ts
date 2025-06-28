import { test, expect, AnnotationType } from "../tester";

test.describe("FAQ Page - Additional Coverage", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "FAQ 추가 테스트");
    // FAQ 페이지로 이동
    await page.goto("/faq", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
  });

  test("FAQ 페이지 메타데이터 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "메타데이터");

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/자주 묻는 질문 | ALL AD/);

    // 메타 태그 확인
    const metaDescription = await page.getAttribute(
      'meta[name="description"]',
      "content",
    );
    expect(metaDescription).toContain(
      "ALL AD 서비스 이용에 대한 자주 묻는 질문",
    );
  });

  test("요금제 관련 FAQ 상세 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "요금제 FAQ");

    // 요금제 카테고리로 스크롤
    const pricingCategory = page.getByText("요금제 및 결제", { exact: true });
    await pricingCategory.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Q14: 요금제 구성 확인
    const q14 = page.getByText("Q14: 올애드 요금제는 어떻게 구성되어 있나요?");
    await q14.click();
    await page.waitForTimeout(1000);

    // 무료 기능 설명 확인
    await expect(
      page.getByText(
        "구글 애즈(유튜브, 구글), 메타 애즈(페이스북, 인스타그램)",
      ),
    ).toBeVisible();
    await expect(page.getByText("계정당 최대 5명")).toBeVisible();
    await expect(page.getByText("시간당 1회 API 호출")).toBeVisible();

    // Q15: 무료 체험 기간
    const q15 = page.getByText("Q15: 무료 체험 기간이 있나요?");
    await q15.click();
    await page.waitForTimeout(1000);
    await expect(page.getByText("현재 주요 기능을 무료로 제공")).toBeVisible();
  });

  test("보안 관련 FAQ 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "보안 FAQ");

    // 보안 카테고리로 스크롤
    const securityCategory = page.getByText("보안 및 데이터", { exact: true });
    await securityCategory.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Q18: 보안 관련 질문
    const q18 = page.getByText(
      "Q18: 제 광고 계정 정보와 데이터는 안전하게 관리되나요?",
    );
    await q18.click();
    await page.waitForTimeout(1000);

    // 보안 관련 키워드 확인
    await expect(page.getByText("강력한 보안 기술")).toBeVisible();
    await expect(page.getByText("공식 인증 절차")).toBeVisible();
    await expect(page.getByText("암호화하여 저장")).toBeVisible();
  });

  test("계정 연동 오류 처리 FAQ", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "오류 처리");

    // Q9: 계정 연동 오류 해결
    const q9 = page.getByText(
      "Q9: 계정 연동 시 오류가 발생하면 어떻게 해야 하나요?",
    );
    await q9.click();
    await page.waitForTimeout(1000);

    // 오류 해결 가이드 확인
    await expect(page.getByText("API 접근 권한 만료")).toBeVisible();
    await expect(page.getByText("재인증 절차")).toBeVisible();
    await expect(page.getByText("고객 지원팀")).toBeVisible();
  });

  test("데이터 업데이트 주기 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "데이터 업데이트");

    // Q8: 데이터 업데이트 주기
    const q8 = page.getByText(
      "Q8: 연동된 계정의 데이터는 얼마나 자주 업데이트되나요?",
    );
    await q8.click();
    await page.waitForTimeout(1000);

    // 업데이트 주기 정보 확인
    await expect(page.getByText("시간당 1회")).toBeVisible();
    await expect(page.getByText("더 빠른 업데이트 주기")).toBeVisible();
  });

  test("모든 카테고리 확장/축소 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "전체 확장");

    // 모든 질문 열기
    const allQuestions = page.locator('[data-testid="faq-question"]');
    const count = await allQuestions.count();

    // 처음 5개 질문 열기
    for (let i = 0; i < Math.min(5, count); i++) {
      await allQuestions.nth(i).click();
      await page.waitForTimeout(500);
    }

    // 모든 답변이 표시되는지 확인
    const visibleAnswers = page.locator('[role="region"]:visible');
    const visibleCount = await visibleAnswers.count();
    expect(visibleCount).toBeGreaterThanOrEqual(5);
  });

  test("FAQ 페이지 성능 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "성능");

    // 페이지 로드 시간 측정
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // 로드 시간이 5초 이내인지 확인
    expect(loadTime).toBeLessThan(5000);

    // 이미지나 무거운 리소스가 없는지 확인
    const images = page.locator("img");
    const imageCount = await images.count();
    expect(imageCount).toBe(0); // FAQ 페이지에는 이미지가 없어야 함
  });

  test("FAQ 콘텐츠 일관성 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "일관성");

    // 모든 질문이 Q로 시작하는지 확인
    const questions = page.locator('[data-testid="faq-question"]');
    const questionCount = await questions.count();

    for (let i = 0; i < questionCount; i++) {
      const text = await questions.nth(i).textContent();
      expect(text).toMatch(/^Q\d+:/);
    }

    // 모든 답변이 A로 시작하는지 확인 (첫 3개만 테스트)
    for (let i = 0; i < 3; i++) {
      await questions.nth(i).click();
      await page.waitForTimeout(500);
    }

    const answers = page.locator('[role="region"]:visible');
    const answerCount = await answers.count();

    for (let i = 0; i < answerCount; i++) {
      const text = await answers.nth(i).textContent();
      expect(text).toMatch(/A\d+:/);
    }
  });

  test("페이지 접근성 기본 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "접근성");

    // 헤딩 구조 확인
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);

    const h2 = page.locator("h2");
    const h2Count = await h2.count();
    expect(h2Count).toBe(6); // 6개 카테고리

    // ARIA 속성 확인
    const accordionItems = page.locator('[role="button"][aria-expanded]');
    const accordionCount = await accordionItems.count();
    expect(accordionCount).toBeGreaterThan(0);

    // 첫 번째 아코디언의 ARIA 상태 변경 확인
    const firstAccordion = accordionItems.first();
    const initialExpanded = await firstAccordion.getAttribute("aria-expanded");
    expect(initialExpanded).toBe("false");

    await firstAccordion.click();
    await page.waitForTimeout(500);

    const expandedState = await firstAccordion.getAttribute("aria-expanded");
    expect(expandedState).toBe("true");
  });

  test("FAQ 페이지 네비게이션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "네비게이션");

    // 홈으로 돌아가기 링크 확인 (네비게이션 바에서)
    const homeLink = page.locator('a[href="/"]').first();
    await expect(homeLink).toBeVisible();

    // 페이지 내 앵커 점프 테스트 (카테고리로 이동)
    await page.evaluate(() => {
      const element = document.querySelector('h2:has-text("기술 지원")');
      element?.scrollIntoView({ behavior: "smooth" });
    });
    await page.waitForTimeout(1000);

    // 기술 지원 섹션이 뷰포트에 있는지 확인
    const techSupport = page.getByText("기술 지원", { exact: true });
    await expect(techSupport).toBeInViewport();
  });
});
