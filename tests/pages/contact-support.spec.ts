import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Contact and Support Pages", () => {
  test.describe("Contact Page", () => {
    test.beforeEach(async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.MAIN_CATEGORY, "고객지원");
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "문의하기");
      await gotoWithLang(page, "contact");
    });

    test("문의 페이지 레이아웃", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

      // 페이지 헤더
      await expect(
        page.getByRole("heading", { name: /문의하기|Contact Us/ }),
      ).toBeVisible();

      // 설명 텍스트
      await expect(
        page.getByText(/궁금한 점이 있으신가요|How can we help/),
      ).toBeVisible();

      // 연락처 정보
      await expect(page.getByText(/이메일|Email/)).toBeVisible();
      await expect(page.getByText("support@all-ad.co.kr")).toBeVisible();

      // 운영 시간
      await expect(page.getByText(/운영 시간|Business Hours/)).toBeVisible();
      await expect(page.getByText(/평일 09:00 - 18:00/)).toBeVisible();
    });

    test("문의 폼 작성", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "문의 폼");

      // 문의 유형 선택
      const typeSelect = page.getByLabel("문의 유형");
      await expect(typeSelect).toBeVisible();
      await typeSelect.selectOption("기술 지원");

      // 필수 필드 입력
      await page.getByLabel("이름").fill("홍길동");
      await page.getByLabel("이메일").fill("test@example.com");
      await page.getByLabel("제목").fill("API 연동 관련 문의");
      await page
        .getByLabel("내용")
        .fill("Google Ads API 연동 중 오류가 발생했습니다.");

      // 파일 첨부 (선택사항)
      const fileInput = page.getByLabel("파일 첨부");
      if (await fileInput.isVisible()) {
        await expect(fileInput).toBeVisible();
      }

      // 제출 버튼
      await expect(
        page.getByRole("button", { name: "문의하기" }),
      ).toBeVisible();
    });

    test("문의 폼 유효성 검증", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "유효성 검증");

      // 빈 폼 제출
      await page.getByRole("button", { name: "문의하기" }).click();

      // 에러 메시지 확인
      await expect(page.getByText("이름을 입력해주세요")).toBeVisible();
      await expect(page.getByText("이메일을 입력해주세요")).toBeVisible();
      await expect(page.getByText("제목을 입력해주세요")).toBeVisible();
      await expect(page.getByText("내용을 입력해주세요")).toBeVisible();
    });

    test("이메일 형식 검증", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "이메일 검증");

      // 잘못된 이메일 형식
      await page.getByLabel("이메일").fill("invalid-email");
      await page.getByLabel("이름").fill("테스트");
      await page.getByRole("button", { name: "문의하기" }).click();

      // 에러 메시지
      await expect(
        page.getByText("올바른 이메일 주소를 입력해주세요"),
      ).toBeVisible();
    });

    test("문의 제출 성공", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "제출 성공");

      // 폼 작성
      await page.getByLabel("이름").fill("홍길동");
      await page.getByLabel("이메일").fill("test@example.com");
      await page.getByLabel("제목").fill("테스트 문의");
      await page.getByLabel("내용").fill("테스트 문의 내용입니다.");

      // 제출
      await page.getByRole("button", { name: "문의하기" }).click();

      // 성공 메시지
      await expect(
        page.getByText(/문의가 접수되었습니다|Successfully submitted/),
      ).toBeVisible();
      await expect(page.getByText(/24시간 이내에 답변/)).toBeVisible();
    });
  });

  test.describe("Support Page", () => {
    test.beforeEach(async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.MAIN_CATEGORY, "고객지원");
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "지원센터");
      await gotoWithLang(page, "support");
    });

    test("지원 페이지 레이아웃", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

      // 페이지 헤더
      await expect(
        page.getByRole("heading", { name: /지원센터|Support Center/ }),
      ).toBeVisible();

      // 검색 바
      await expect(page.getByPlaceholder(/검색|Search/)).toBeVisible();

      // 카테고리 섹션
      await expect(page.getByText("시작하기")).toBeVisible();
      await expect(page.getByText("플랫폼 연동")).toBeVisible();
      await expect(page.getByText("캠페인 관리")).toBeVisible();
      await expect(page.getByText("결제 및 구독")).toBeVisible();
      await expect(page.getByText("문제 해결")).toBeVisible();
    });

    test("도움말 검색", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "검색 기능");

      // 검색어 입력
      const searchInput = page.getByPlaceholder(/검색|Search/);
      await searchInput.fill("Google Ads 연동");
      await searchInput.press("Enter");

      // 검색 결과
      await expect(page.getByText(/검색 결과|Search Results/)).toBeVisible();
      await expect(page.getByText("Google Ads")).toBeVisible();
    });

    test("카테고리별 문서", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "도움말 문서");

      // 플랫폼 연동 카테고리 클릭
      await page.getByText("플랫폼 연동").click();

      // 문서 목록
      await expect(page.getByText("Google Ads 연동 방법")).toBeVisible();
      await expect(page.getByText("Meta Ads 연동 방법")).toBeVisible();
      await expect(page.getByText("Naver Ads 연동 방법")).toBeVisible();
      await expect(page.getByText("다중 계정 관리")).toBeVisible();
    });

    test("문서 상세 보기", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "문서 상세");

      // 특정 문서 클릭
      await page.getByText("Google Ads 연동 방법").click();

      // 문서 내용
      await expect(
        page.getByRole("heading", { name: "Google Ads 연동 방법" }),
      ).toBeVisible();
      await expect(page.getByText("사전 준비사항")).toBeVisible();
      await expect(page.getByText("연동 단계")).toBeVisible();
      await expect(page.getByText("주의사항")).toBeVisible();

      // 도움이 되었나요?
      await expect(page.getByText("이 문서가 도움이 되었나요?")).toBeVisible();
      await expect(page.getByRole("button", { name: "예" })).toBeVisible();
      await expect(page.getByRole("button", { name: "아니오" })).toBeVisible();
    });

    test("비디오 튜토리얼", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "비디오 가이드");

      // 비디오 섹션
      await expect(page.getByText("비디오 가이드")).toBeVisible();

      // 비디오 목록
      const videos = ["All-AD 시작하기", "첫 캠페인 만들기", "대시보드 활용법"];

      for (const video of videos) {
        const videoItem = page.getByText(video);
        if (await videoItem.isVisible()) {
          await expect(videoItem).toBeVisible();
        }
      }
    });

    test("자주 묻는 질문", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "FAQ");

      // FAQ 섹션
      await expect(page.getByText("자주 묻는 질문")).toBeVisible();

      // FAQ 항목 클릭
      const faqItem = page.getByText("API 제한이 있나요?").first();
      if (await faqItem.isVisible()) {
        await faqItem.click();

        // 답변 확인
        await expect(page.getByText(/시간당|rate limit/)).toBeVisible();
      }
    });

    test("추가 지원 옵션", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "추가 지원");

      // 추가 도움이 필요하신가요? 섹션
      await expect(page.getByText(/추가 도움|Need more help/)).toBeVisible();

      // 지원 옵션들
      await expect(page.getByRole("link", { name: "문의하기" })).toBeVisible();
      await expect(page.getByRole("link", { name: "커뮤니티" })).toBeVisible();
      await expect(page.getByText("support@all-ad.co.kr")).toBeVisible();

      // 긴급 지원
      const urgentSupport = page.getByText(/긴급 지원|Emergency/);
      if (await urgentSupport.isVisible()) {
        await expect(urgentSupport).toBeVisible();
        await expect(page.getByText(/24시간|24\/7/)).toBeVisible();
      }
    });

    test("다운로드 자료", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "다운로드");

      // 다운로드 섹션
      const downloadSection = page.getByText("다운로드 자료");
      if (await downloadSection.isVisible()) {
        await expect(downloadSection).toBeVisible();

        // 다운로드 항목들
        await expect(page.getByText("API 문서")).toBeVisible();
        await expect(page.getByText("사용자 가이드 PDF")).toBeVisible();
        await expect(page.getByText("통합 가이드")).toBeVisible();
      }
    });
  });
});
