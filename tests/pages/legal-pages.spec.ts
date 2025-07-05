import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Legal Pages", () => {
  test.describe("Terms of Service", () => {
    test.beforeEach(async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.MAIN_CATEGORY, "법적 문서");
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "이용약관");
      await gotoWithLang(page, "terms");
    });

    test("이용약관 페이지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 확인");

      // 페이지 제목
      await expect(
        page.getByRole("heading", { name: /이용약관|Terms of Service/ }),
      ).toBeVisible();

      // 최종 수정일
      await expect(page.getByText(/최종 수정일|Last updated/)).toBeVisible();

      // 주요 섹션들
      await expect(page.getByText("1. 서비스 이용")).toBeVisible();
      await expect(page.getByText("2. 계정 및 보안")).toBeVisible();
      await expect(page.getByText("3. 사용자 의무")).toBeVisible();
      await expect(page.getByText("4. 서비스 제한")).toBeVisible();
      await expect(page.getByText("5. 지적재산권")).toBeVisible();
      await expect(page.getByText("6. 면책조항")).toBeVisible();
      await expect(page.getByText("7. 손해배상")).toBeVisible();
      await expect(page.getByText("8. 약관 변경")).toBeVisible();
    });

    test("목차 네비게이션", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "목차 기능");

      // 목차가 있는 경우
      const toc = page.locator("[class*='toc'], [class*='table-of-contents']");
      if (await toc.isVisible()) {
        // 목차 항목 클릭
        await toc.getByText("계정 및 보안").click();

        // 해당 섹션으로 스크롤 확인
        await expect(
          page.getByRole("heading", { name: "계정 및 보안" }),
        ).toBeInViewport();
      }
    });
  });

  test.describe("Privacy Policy", () => {
    test.beforeEach(async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.MAIN_CATEGORY, "법적 문서");
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "개인정보처리방침");
      await gotoWithLang(page, "privacy");
    });

    test("개인정보처리방침 페이지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 확인");

      // 페이지 제목
      await expect(
        page.getByRole("heading", { name: /개인정보처리방침|Privacy Policy/ }),
      ).toBeVisible();

      // 주요 섹션들
      await expect(page.getByText("1. 수집하는 개인정보")).toBeVisible();
      await expect(page.getByText("2. 개인정보 수집 방법")).toBeVisible();
      await expect(page.getByText("3. 개인정보 이용 목적")).toBeVisible();
      await expect(page.getByText("4. 개인정보 보유 기간")).toBeVisible();
      await expect(page.getByText("5. 개인정보 제3자 제공")).toBeVisible();
      await expect(page.getByText("6. 개인정보 보호")).toBeVisible();
      await expect(page.getByText("7. 이용자 권리")).toBeVisible();
      await expect(page.getByText("8. 쿠키 정책")).toBeVisible();
    });

    test("개인정보 보호책임자 정보", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "책임자 정보");

      // 개인정보 보호책임자 섹션
      await expect(page.getByText("개인정보 보호책임자")).toBeVisible();
      await expect(
        page.getByText(/이메일.*privacy@all-ad.co.kr/),
      ).toBeVisible();
      await expect(page.getByText(/전화.*02-/)).toBeVisible();
    });
  });

  test.describe("Refund Policy", () => {
    test.beforeEach(async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.MAIN_CATEGORY, "법적 문서");
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "환불정책");
      await gotoWithLang(page, "refund-policy");
    });

    test("환불정책 페이지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 확인");

      // 페이지 제목
      await expect(
        page.getByRole("heading", {
          name: /환불.*정책|청약철회|Refund Policy/,
        }),
      ).toBeVisible();

      // 주요 내용
      await expect(page.getByText(/환불 가능 기간/)).toBeVisible();
      await expect(page.getByText(/7일|14일/)).toBeVisible();
      await expect(page.getByText("환불 조건")).toBeVisible();
      await expect(page.getByText("환불 절차")).toBeVisible();
      await expect(page.getByText("환불 불가 사항")).toBeVisible();
    });

    test("환불 신청 방법", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "환불 신청");

      // 환불 신청 섹션
      await expect(page.getByText("환불 신청 방법")).toBeVisible();

      // 신청 단계
      await expect(page.getByText("1. 고객센터 문의")).toBeVisible();
      await expect(page.getByText("2. 환불 사유 작성")).toBeVisible();
      await expect(page.getByText("3. 환불 승인")).toBeVisible();
      await expect(page.getByText("4. 환불 처리")).toBeVisible();

      // 연락처
      await expect(page.getByText("support@all-ad.co.kr")).toBeVisible();
    });
  });

  test.describe("Cookie Policy", () => {
    test.beforeEach(async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.MAIN_CATEGORY, "법적 문서");
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "쿠키정책");
      await gotoWithLang(page, "cookies");
    });

    test("쿠키정책 페이지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 확인");

      // 페이지 제목
      await expect(
        page.getByRole("heading", { name: /쿠키.*정책|Cookie Policy/ }),
      ).toBeVisible();

      // 주요 섹션들
      await expect(page.getByText("쿠키란?")).toBeVisible();
      await expect(page.getByText("사용하는 쿠키 유형")).toBeVisible();
      await expect(page.getByText("필수 쿠키")).toBeVisible();
      await expect(page.getByText("분석 쿠키")).toBeVisible();
      await expect(page.getByText("마케팅 쿠키")).toBeVisible();
      await expect(page.getByText("쿠키 관리 방법")).toBeVisible();
    });

    test("쿠키 설정 관리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "쿠키 설정");

      // 쿠키 설정 버튼
      const cookieSettingsButton = page.getByRole("button", {
        name: /쿠키 설정|Cookie Settings/,
      });
      if (await cookieSettingsButton.isVisible()) {
        await cookieSettingsButton.click();

        // 쿠키 설정 모달
        await expect(page.getByText("쿠키 설정")).toBeVisible();
        await expect(page.getByLabel("필수 쿠키")).toBeVisible();
        await expect(page.getByLabel("분석 쿠키")).toBeVisible();
        await expect(page.getByLabel("마케팅 쿠키")).toBeVisible();
      }
    });
  });

  test.describe("Common Legal Page Features", () => {
    const legalPages = [
      { path: "/terms", name: "이용약관" },
      { path: "/privacy", name: "개인정보처리방침" },
      { path: "/refund-policy", name: "환불정책" },
      { path: "/cookies", name: "쿠키정책" },
    ];

    for (const { path, name } of legalPages) {
      test(`${name} - 공통 기능`, async ({ page, pushAnnotation }) => {
        pushAnnotation(AnnotationType.MAIN_CATEGORY, "법적 문서");
        pushAnnotation(AnnotationType.SUB_CATEGORY1, name);
        pushAnnotation(AnnotationType.SUB_CATEGORY2, "공통 기능");

        await page.goto(path);

        // 인쇄 버튼
        const printButton = page.getByRole("button", { name: /인쇄|Print/ });
        if (await printButton.isVisible()) {
          await expect(printButton).toBeVisible();
        }

        // PDF 다운로드
        const downloadButton = page.getByRole("button", {
          name: /다운로드|Download|PDF/,
        });
        if (await downloadButton.isVisible()) {
          await expect(downloadButton).toBeVisible();
        }

        // 페이지 맨 위로 버튼
        await page.evaluate(() => window.scrollTo(0, 1000));
        const topButton = page.getByRole("button", { name: /맨 위로|Top|↑/ });
        if (await topButton.isVisible()) {
          await topButton.click();
          await expect(
            page.evaluate(
              () =>
                document.body.scrollTop || document.documentElement.scrollTop,
            ),
          ).resolves.toBe(0);
        }

        // 다른 법적 문서 링크
        const legalLinks = page.locator("footer").locator("a");
        await expect(legalLinks.filter({ hasText: "이용약관" })).toBeVisible();
        await expect(
          legalLinks.filter({ hasText: "개인정보처리방침" }),
        ).toBeVisible();
      });
    }
  });
});
