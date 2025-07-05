import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Pricing Page", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "가격");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "요금제");
    await gotoWithLang(page, "pricing");
  });

  test("가격 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 페이지 헤더
    await expect(
      page.getByRole("heading", { name: /요금제|가격|Pricing/ }),
    ).toBeVisible();

    // 부제목
    await expect(
      page.getByText(/비즈니스 규모에 맞는 요금제를 선택하세요/),
    ).toBeVisible();

    // 요금제 카드들 확인
    await expect(page.getByText("무료")).toBeVisible();
    await expect(page.getByText(/프로|Pro/)).toBeVisible();
    await expect(page.getByText(/비즈니스|Business|Enterprise/)).toBeVisible();
  });

  test("무료 요금제 상세", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "무료 요금제");

    const freeCard = page.locator("div").filter({ hasText: "무료" }).first();

    // 가격 표시
    await expect(freeCard.getByText("₩0")).toBeVisible();
    await expect(freeCard.getByText(/월|month/)).toBeVisible();

    // 기능 목록
    await expect(freeCard.getByText("최대 5명 팀원")).toBeVisible();
    await expect(freeCard.getByText("Google Ads, Meta Ads 지원")).toBeVisible();
    await expect(
      freeCard.getByText("시간당 1회 데이터 업데이트"),
    ).toBeVisible();
    await expect(freeCard.getByText("기본 대시보드")).toBeVisible();

    // 시작하기 버튼
    const startButton = freeCard.getByRole("button", {
      name: /시작하기|Get Started/,
    });
    await expect(startButton).toBeVisible();
  });

  test("프로 요금제 상세", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "프로 요금제");

    const proCard = page
      .locator("div")
      .filter({ hasText: /프로|Pro/ })
      .first();

    // 가격 표시
    await expect(proCard.getByText(/₩[\d,]+/)).toBeVisible();

    // 추천 배지
    await expect(proCard.getByText(/추천|Recommended|인기/)).toBeVisible();

    // 프로 기능 목록
    await expect(proCard.getByText(/무제한 팀원|Unlimited/)).toBeVisible();
    await expect(proCard.getByText(/모든 플랫폼 지원/)).toBeVisible();
    await expect(proCard.getByText(/실시간 데이터 업데이트/)).toBeVisible();
    await expect(proCard.getByText(/고급 분석/)).toBeVisible();
    await expect(proCard.getByText(/API 액세스/)).toBeVisible();

    // 구독 버튼
    const subscribeButton = proCard.getByRole("button", {
      name: /구독하기|Subscribe/,
    });
    await expect(subscribeButton).toBeVisible();
  });

  test("엔터프라이즈 요금제 상세", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "엔터프라이즈 요금제");

    const enterpriseCard = page
      .locator("div")
      .filter({ hasText: /비즈니스|Business|Enterprise/ })
      .first();

    // 맞춤 가격
    await expect(
      enterpriseCard.getByText(/맞춤 견적|Contact|문의/),
    ).toBeVisible();

    // 엔터프라이즈 기능
    await expect(enterpriseCard.getByText(/전담 지원/)).toBeVisible();
    await expect(enterpriseCard.getByText(/커스텀 통합/)).toBeVisible();
    await expect(enterpriseCard.getByText(/SLA 보장/)).toBeVisible();
    await expect(enterpriseCard.getByText(/온프레미스 옵션/)).toBeVisible();

    // 문의 버튼
    const contactButton = enterpriseCard.getByRole("button", {
      name: /문의하기|Contact Sales/,
    });
    await expect(contactButton).toBeVisible();
  });

  test("요금제 비교 테이블", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "요금제 비교");

    // 비교 테이블 섹션
    await expect(page.getByText("요금제 비교")).toBeVisible();

    // 테이블 헤더
    const table = page.locator("table");
    await expect(table).toBeVisible();
    await expect(table.getByText("기능")).toBeVisible();
    await expect(table.getByText("무료")).toBeVisible();
    await expect(table.getByText(/프로|Pro/)).toBeVisible();
    await expect(table.getByText(/엔터프라이즈|Enterprise/)).toBeVisible();

    // 주요 기능 행들
    await expect(table.getByText("팀원 수")).toBeVisible();
    await expect(table.getByText("지원 플랫폼")).toBeVisible();
    await expect(table.getByText("데이터 업데이트")).toBeVisible();
    await expect(table.getByText("API 액세스")).toBeVisible();
    await expect(table.getByText("고객 지원")).toBeVisible();
  });

  test("FAQ 섹션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "자주 묻는 질문");

    // FAQ 섹션
    await expect(page.getByText("자주 묻는 질문")).toBeVisible();

    // FAQ 항목들
    const faqQuestions = [
      "무료 체험이 가능한가요?",
      "언제든지 요금제를 변경할 수 있나요?",
      "환불 정책은 어떻게 되나요?",
      "결제 방법은 무엇이 있나요?",
    ];

    for (const question of faqQuestions) {
      const faqItem = page.getByText(question);
      if (await faqItem.isVisible()) {
        await faqItem.click();
        // 답변이 펼쳐지는지 확인
        await expect(
          page.locator("div[class*='expanded'], div[class*='open']"),
        ).toBeVisible();
      }
    }
  });

  test("결제 방법 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "결제 수단");

    // 결제 방법 섹션
    await expect(page.getByText(/결제 방법|Payment Methods/)).toBeVisible();

    // 지원 결제 수단
    await expect(page.getByText("신용카드")).toBeVisible();
    await expect(page.getByText(/계좌이체|Bank Transfer/)).toBeVisible();

    // 결제 아이콘들
    const paymentIcons = page.locator(
      "img[alt*='Visa'], img[alt*='Mastercard'], img[alt*='payment']",
    );
    await expect(paymentIcons.first()).toBeVisible();
  });

  test("할인 및 프로모션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "프로모션");

    // 연간 결제 할인
    const annualToggle = page.getByLabel(/연간 결제|Annual/);
    if (await annualToggle.isVisible()) {
      await annualToggle.click();

      // 할인율 표시 확인
      await expect(page.getByText(/\d+% 할인|Save \d+%/)).toBeVisible();
    }

    // 프로모션 배너
    const promoBanner = page
      .locator("[class*='promo'], [class*='banner']")
      .first();
    if (await promoBanner.isVisible()) {
      await expect(promoBanner.getByText(/할인|특별|Limited/)).toBeVisible();
    }
  });

  test("요금제 선택 후 가입 프로세스", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "가입 프로세스");

    // 프로 요금제 선택
    const proCard = page
      .locator("div")
      .filter({ hasText: /프로|Pro/ })
      .first();
    const subscribeButton = proCard.getByRole("button", {
      name: /구독하기|Subscribe/,
    });
    await subscribeButton.click();

    // 로그인 상태에 따른 리디렉션
    // 비로그인: 로그인 페이지로
    // 로그인: 결제 페이지로
    await expect(page).toHaveURL(/login|checkout|payment/);
  });

  test("문의하기 폼", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "영업 문의");

    // 엔터프라이즈 문의 버튼 클릭
    const contactButton = page
      .getByRole("button", { name: /문의하기|Contact Sales/ })
      .first();
    await contactButton.click();

    // 문의 폼 또는 모달 확인
    await expect(page.getByText(/문의|Contact Form/)).toBeVisible();
    await expect(page.getByLabel("회사명")).toBeVisible();
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("전화번호")).toBeVisible();
    await expect(page.getByLabel(/메시지|Message/)).toBeVisible();
  });
});
