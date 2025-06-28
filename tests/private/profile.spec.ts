import { test, expect, AnnotationType } from "../tester";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "프로필");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "프로필 관리");
    await page.goto("/profile");
  });

  test("프로필 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "UI 요소 확인");

    // 페이지 헤더 확인
    await expect(
      page.getByRole("heading", { name: /프로필|내 정보/ }),
    ).toBeVisible();

    // 기본 정보 섹션
    await expect(page.getByText("기본 정보")).toBeVisible();

    // 이메일 필드 (읽기 전용)
    const emailField = page.getByLabel("이메일");
    await expect(emailField).toBeVisible();
    await expect(emailField).toBeDisabled();

    // 이름 필드
    await expect(page.getByLabel("이름")).toBeVisible();

    // 전화번호 필드
    await expect(page.getByLabel("전화번호")).toBeVisible();

    // 저장 버튼
    await expect(page.getByRole("button", { name: "저장" })).toBeVisible();
  });

  test("프로필 정보 수정", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "정보 수정");

    // 이름 수정
    const nameInput = page.getByLabel("이름");
    await nameInput.clear();
    await nameInput.fill("홍길동");

    // 전화번호 수정
    const phoneInput = page.getByLabel("전화번호");
    await phoneInput.clear();
    await phoneInput.fill("010-1234-5678");

    // 저장 버튼 클릭
    await page.getByRole("button", { name: "저장" }).click();

    // 성공 메시지 확인
    await expect(
      page.getByText(/프로필이 업데이트되었습니다|저장되었습니다/),
    ).toBeVisible();
  });

  test("프로필 사진 업로드", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "프로필 사진");

    // 프로필 사진 섹션 확인
    await expect(page.getByText("프로필 사진")).toBeVisible();

    // 업로드 버튼 확인
    const uploadButton = page.getByRole("button", { name: /사진 변경|업로드/ });
    await expect(uploadButton).toBeVisible();

    // 파일 업로드 테스트 (실제 파일 없이 버튼 동작만 확인)
    await uploadButton.click();
  });

  test("비밀번호 변경 섹션", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "비밀번호 변경");

    // 비밀번호 변경 섹션 확인
    await expect(page.getByText("비밀번호 변경")).toBeVisible();

    // 현재 비밀번호 필드
    await expect(page.getByLabel("현재 비밀번호")).toBeVisible();

    // 새 비밀번호 필드
    await expect(page.getByLabel("새 비밀번호")).toBeVisible();

    // 비밀번호 확인 필드
    await expect(page.getByLabel("비밀번호 확인")).toBeVisible();

    // 비밀번호 변경 버튼
    await expect(
      page.getByRole("button", { name: "비밀번호 변경" }),
    ).toBeVisible();
  });

  test("비밀번호 변경 유효성 검증", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "비밀번호 유효성");

    // 짧은 비밀번호 입력
    await page.getByLabel("현재 비밀번호").fill("current123");
    await page.getByLabel("새 비밀번호").fill("123");
    await page.getByLabel("비밀번호 확인").fill("123");
    await page.getByRole("button", { name: "비밀번호 변경" }).click();

    // 에러 메시지 확인
    await expect(
      page.getByText("비밀번호는 최소 6자 이상이어야 합니다"),
    ).toBeVisible();
  });

  test("알림 설정", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "알림 설정");

    // 알림 설정 섹션 확인
    await expect(page.getByText("알림 설정")).toBeVisible();

    // 이메일 알림 토글
    const emailNotificationToggle = page.getByLabel("이메일 알림");
    await expect(emailNotificationToggle).toBeVisible();

    // 캠페인 알림 토글
    const campaignNotificationToggle = page.getByLabel("캠페인 알림");
    await expect(campaignNotificationToggle).toBeVisible();

    // 토글 상태 변경
    await emailNotificationToggle.click();
    await campaignNotificationToggle.click();

    // 변경사항 저장
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText(/설정이 저장되었습니다/)).toBeVisible();
  });

  test("계정 삭제", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "계정 삭제");

    // 계정 삭제 섹션 확인
    await expect(page.getByText("계정 삭제")).toBeVisible();
    await expect(
      page.getByText(/계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다/),
    ).toBeVisible();

    // 계정 삭제 버튼
    const deleteButton = page.getByRole("button", { name: "계정 삭제" });
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toHaveClass(/danger|destructive/);

    // 삭제 버튼 클릭 시 확인 모달
    await deleteButton.click();
    await expect(
      page.getByText("정말로 계정을 삭제하시겠습니까?"),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
    await expect(page.getByRole("button", { name: "삭제" })).toBeVisible();

    // 취소 클릭
    await page.getByRole("button", { name: "취소" }).click();
  });

  test("연동된 플랫폼 표시", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "플랫폼 연동");

    // 연동된 플랫폼 섹션 확인
    await expect(page.getByText("연동된 플랫폼")).toBeVisible();

    // 플랫폼 목록 확인 (최소 하나 이상의 플랫폼이 표시되어야 함)
    const platformSection = page
      .locator("section")
      .filter({ hasText: "연동된 플랫폼" });
    await expect(platformSection).toBeVisible();

    // 플랫폼 연동 관리 링크
    const manageLink = page.getByRole("link", { name: "플랫폼 관리" });
    await expect(manageLink).toBeVisible();
  });
});
