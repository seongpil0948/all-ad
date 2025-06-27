import { test, expect, AnnotationType } from "../tester";

test.describe("FAQ Page", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "FAQ 페이지");
    // FAQ 페이지로 이동
    await page.goto("/faq", { waitUntil: "domcontentloaded" });
    // 페이지가 완전히 로드될 때까지 기다리기
    await page.waitForTimeout(2000);
  });

  test("페이지 기본 구조 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 레이아웃");

    // 페이지 타이틀 확인
    await expect(page.getByText("자주 묻는 질문", { exact: false })).toBeVisible();
    
    // 부제목 확인
    await expect(page.getByText("ALL AD 서비스 이용에 대한", { exact: false })).toBeVisible();
  });

  test("FAQ 카테고리 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "카테고리");

    const categories = [
      "서비스 일반",
      "계정 연동",
      "기능 관련",
      "요금제 및 결제",
      "보안 및 데이터",
      "기술 지원",
    ];

    // 각 카테고리가 표시되는지 확인
    for (const category of categories) {
      await expect(page.getByText(category, { exact: true })).toBeVisible();
    }
  });

  test("Accordion 기능 동작", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "Accordion 상호작용");

    // 첫 번째 질문 찾기
    const firstQuestion = page.getByText("Q1: 올애드(All-AD)는 어떤 서비스인가요?");
    await expect(firstQuestion).toBeVisible();

    // 첫 번째 답변 컨테이너 찾기
    const firstAnswer = page.getByText("A1: 올애드는 여러 광고 플랫폼", { exact: false });
    
    // 초기 상태에서는 답변이 숨겨져 있는지 확인
    await expect(firstAnswer).not.toBeVisible();

    // 질문 클릭하여 답변 열기
    await firstQuestion.click();
    await page.waitForTimeout(1000); // 애니메이션 대기
    await expect(firstAnswer).toBeVisible();

    // 다시 클릭하여 답변 닫기
    await firstQuestion.click();
    await page.waitForTimeout(1000); // 애니메이션 대기
    await expect(firstAnswer).not.toBeVisible();
  });

  test("다중 Accordion 동시 확장", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "다중 확장");

    // 첫 번째 질문 열기
    const firstQuestion = page.getByText("Q1: 올애드(All-AD)는 어떤 서비스인가요?");
    await firstQuestion.click();
    await page.waitForTimeout(1000);

    const firstAnswer = page.getByText("A1: 올애드는 여러 광고 플랫폼", { exact: false });
    await expect(firstAnswer).toBeVisible();

    // 두 번째 질문도 열기 (다중 확장 가능)
    const secondQuestion = page.getByText("Q2: 올애드를 사용하면 어떤 점이 좋은가요?");
    await secondQuestion.click();
    await page.waitForTimeout(1000);

    const secondAnswer = page.getByText("A2: 여러 광고 플랫폼에 각각 접속하여", { exact: false });
    await expect(secondAnswer).toBeVisible();

    // 첫 번째 답변도 여전히 보여야 함
    await expect(firstAnswer).toBeVisible();
  });

  test("주요 FAQ 내용 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "내용 검증");

    // 주요 질문들이 존재하는지 확인
    const importantQuestions = [
      "Q1: 올애드(All-AD)는 어떤 서비스인가요?",
      "Q5: 어떤 광고 플랫폼을 연동할 수 있나요?",
      "Q6: 광고 계정 연동은 어떻게 하나요?",
      "Q18: 제 광고 계정 정보와 데이터는 안전하게 관리되나요?",
      "Q14: 올애드 요금제는 어떻게 구성되어 있나요?",
    ];

    for (const question of importantQuestions) {
      await expect(page.getByText(question, { exact: false })).toBeVisible();
    }
  });

  test("사용자 역할에 대한 FAQ 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "사용자 역할");

    // Q13 질문 찾기
    const q13 = page.getByText("Q13: 팀원들과 함께 사용할 수 있나요?");
    await expect(q13).toBeVisible();
    
    // 클릭하여 답변 표시
    await q13.click();
    await page.waitForTimeout(1000);
    
    // Master, Team Mate, Viewer 역할 설명 확인
    await expect(page.getByText("Master: 계정의 모든 설정과 기능 사용")).toBeVisible();
    await expect(page.getByText("Team Mate: 캠페인 편집")).toBeVisible();
    await expect(page.getByText("Viewer: 데이터 조회만 가능")).toBeVisible();
  });

  test("지원 플랫폼 목록 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "플랫폼 지원");

    // Q5 질문 찾기
    const q5 = page.getByText("Q5: 어떤 광고 플랫폼을 연동할 수 있나요?");
    await expect(q5).toBeVisible();
    
    // 클릭하여 답변 표시
    await q5.click();
    await page.waitForTimeout(1000);
    
    // 현재 지원 플랫폼
    const currentPlatforms = ["구글 애즈", "메타 애즈", "쿠팡 애즈"];
    for (const platform of currentPlatforms) {
      await expect(page.getByText(platform, { exact: false })).toBeVisible();
    }
    
    // 예정 플랫폼
    const futurePlatforms = ["네이버 광고", "카카오 모먼트", "틱톡 애즈"];
    for (const platform of futurePlatforms) {
      await expect(page.getByText(platform, { exact: false })).toBeVisible();
    }
  });

  test("Accordion 접근성 테스트", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "접근성");

    // 키보드 네비게이션 테스트
    const firstQuestion = page.getByText("Q1: 올애드(All-AD)는 어떤 서비스인가요?");
    
    // Tab 키로 이동
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Enter 키로 확장
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    
    // 답변이 표시되는지 확인
    const firstAnswer = page.getByText("A1: 올애드는 여러 광고 플랫폼", { exact: false });
    await expect(firstAnswer).toBeVisible();
  });

  test("모바일 반응형 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "반응형");

    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // 뷰포트 변경 후 재렌더링 대기

    // FAQ 항목들이 여전히 보이는지 확인
    await expect(page.getByText("자주 묻는 질문", { exact: false })).toBeVisible();

    // Accordion이 모바일에서도 작동하는지
    const firstQuestion = page.getByText("Q1: 올애드(All-AD)는 어떤 서비스인가요?");
    await firstQuestion.click();
    await page.waitForTimeout(1000); // 애니메이션 대기

    const firstAnswer = page.getByText("A1: 올애드는 여러 광고 플랫폼", { exact: false });
    await expect(firstAnswer).toBeVisible();
  });

  test("스크롤 네비게이션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "스크롤");

    // 페이지 하단으로 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000); // 스크롤 애니메이션 대기

    // 마지막 FAQ 항목 확인
    await expect(page.getByText("Q21: API 키 발급 방법", { exact: false })).toBeVisible();

    // 다시 상단으로 스크롤
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000); // 스크롤 애니메이션 대기

    // 첫 번째 FAQ 항목 확인
    await expect(page.getByText("Q1: 올애드(All-AD)는 어떤 서비스인가요?")).toBeVisible();
  });

  test("이메일 링크 클릭", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "외부 링크");

    // 페이지 하단으로 스크롤하여 Q20 찾기
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Q20 답변 열기
    const q20 = page.getByText("Q20: 서비스 이용 중 문제가 발생하면 어디에 문의해야 하나요?");
    await q20.click();
    await page.waitForTimeout(1000); // 애니메이션 대기

    // 이메일 링크 확인
    const emailLink = page.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();

    // mailto 링크인지 확인
    const href = await emailLink.getAttribute("href");
    expect(href).toContain("mailto:allofadvertisements@gmail.com");
  });

  test("카테고리별 질문 수 확인", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "질문 수");

    // 각 카테고리의 질문 수 확인
    const categoryQuestionCounts = {
      "서비스 일반": 4,
      "계정 연동": 5,
      "기능 관련": 4,
      "요금제 및 결제": 4,
      "보안 및 데이터": 2,
      "기술 지원": 2,
    };

    // 각 카테고리가 있는지 확인
    for (const category of Object.keys(categoryQuestionCounts)) {
      await expect(page.getByText(category, { exact: true })).toBeVisible();
    }
    
    // 전체 FAQ 질문 수 확인 (21개)
    const allQuestions = page.locator('[data-testid="faq-question"]');
    const totalCount = await allQuestions.count();
    expect(totalCount).toBe(21);
  });

  test("FAQ 콘텐츠 정확성 검증", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "콘텐츠 검증");

    // 첫 번째 질문과 답변 확인
    const firstQuestion = page.getByText("Q1: 올애드(All-AD)는 어떤 서비스인가요?");
    await firstQuestion.click();
    await page.waitForTimeout(1000);

    // 답변 내용 확인
    await expect(page.getByText("올애드는 여러 광고 플랫폼", { exact: false })).toBeVisible();
    await expect(page.getByText("통합적으로 관리하고 분석", { exact: false })).toBeVisible();
  });


});
