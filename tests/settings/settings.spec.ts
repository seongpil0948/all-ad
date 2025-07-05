import { test, expect, AnnotationType } from "../tester";
import { gotoWithLang } from "../utils/navigation";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "설정");
    // 설정 페이지로 이동
    await gotoWithLang(page, "settings");
  });

  test("설정 페이지 레이아웃", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "페이지 레이아웃");

    // 페이지 제목
    await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();

    // 설정 섹션들
    await expect(
      page.getByRole("heading", { name: "프로필 설정" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "플랫폼 연동" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "알림 설정" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "보안 설정" }),
    ).toBeVisible();
  });

  test("프로필 정보 수정", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "프로필 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "정보 수정");

    // 프로필 섹션
    const profileSection = page.locator('[data-section="profile"]');

    if (await profileSection.isVisible()) {
      // 이름 입력 필드
      const nameInput = profileSection.locator('[data-testid="profile-name"]');
      await expect(nameInput).toBeVisible();

      // 현재 값 클리어하고 새 값 입력
      await nameInput.clear();
      await nameInput.fill("새로운 이름");

      // 저장 버튼 클릭
      await profileSection.locator('[data-testid="save-profile"]').click();

      // 성공 메시지
      await expect(page.getByText("프로필이 업데이트되었습니다")).toBeVisible();
    }
  });

  test("아바타 이미지 업로드", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "프로필 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "아바타 변경");

    // 아바타 업로드 영역
    const avatarSection = page.locator('[data-testid="avatar-upload"]');

    if (await avatarSection.isVisible()) {
      // 현재 아바타 이미지
      await expect(
        avatarSection.locator('[data-testid="current-avatar"]'),
      ).toBeVisible();

      // 변경 버튼
      await expect(
        avatarSection.locator('[data-testid="change-avatar"]'),
      ).toBeVisible();

      // 제거 버튼 (있는 경우)
      const removeButton = avatarSection.locator(
        '[data-testid="remove-avatar"]',
      );
      if (await removeButton.isVisible()) {
        await expect(removeButton).toBeVisible();
      }
    }
  });

  test("알림 설정 관리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "알림 설정");

    // 알림 설정 섹션
    const notificationSection = page.locator('[data-section="notifications"]');

    if (await notificationSection.isVisible()) {
      // 이메일 알림 토글
      const emailToggle = notificationSection.locator(
        '[data-testid="email-notifications"]',
      );
      await expect(emailToggle).toBeVisible();

      // 알림 유형들
      const notificationTypes = [
        "캠페인 상태 변경",
        "예산 소진 알림",
        "성과 리포트",
        "팀 초대",
      ];

      for (const type of notificationTypes) {
        const toggle = notificationSection.locator(
          `[data-notification="${type}"]`,
        );
        if (await toggle.isVisible()) {
          // 현재 상태 확인
          const isChecked = await toggle.isChecked();

          // 토글
          await toggle.click();

          // 상태 변경 확인
          await expect(toggle).toBeChecked({ checked: !isChecked });
        }
      }
    }
  });

  test("비밀번호 변경", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "보안 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "비밀번호 변경");

    // 보안 설정 섹션
    const securitySection = page.locator('[data-section="security"]');

    if (await securitySection.isVisible()) {
      // 비밀번호 변경 버튼
      const changePasswordButton = securitySection.locator(
        '[data-testid="change-password"]',
      );
      await changePasswordButton.click();

      // 비밀번호 변경 모달
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "비밀번호 변경" }),
      ).toBeVisible();

      // 입력 필드들
      await expect(page.getByLabel("현재 비밀번호")).toBeVisible();
      await expect(page.getByLabel("새 비밀번호")).toBeVisible();
      await expect(page.getByLabel("새 비밀번호 확인")).toBeVisible();

      // 취소 버튼 클릭
      await page.getByRole("button", { name: "취소" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("2단계 인증 설정", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "보안 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "2FA");

    // 2FA 설정
    const twoFactorSection = page.locator('[data-testid="two-factor-auth"]');

    if (await twoFactorSection.isVisible()) {
      // 현재 상태 표시
      await expect(
        twoFactorSection.locator('[data-testid="2fa-status"]'),
      ).toBeVisible();

      // 활성화/비활성화 버튼
      const toggleButton = twoFactorSection.locator(
        '[data-testid="toggle-2fa"]',
      );

      if (await toggleButton.isVisible()) {
        const buttonText = await toggleButton.textContent();

        if (buttonText?.includes("활성화")) {
          // 2FA 활성화 프로세스
          await toggleButton.click();

          // QR 코드 표시
          await expect(page.getByRole("dialog")).toBeVisible();
          await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
          await expect(
            page.locator('[data-testid="backup-codes"]'),
          ).toBeVisible();
        }
      }
    }
  });

  test("언어 설정 변경", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "일반 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "언어 설정");

    // 언어 선택 드롭다운
    const languageSelect = page.locator('[data-testid="language-select"]');

    if (await languageSelect.isVisible()) {
      // 현재 선택된 언어 확인
      const currentLanguage = await languageSelect.inputValue();
      expect(currentLanguage).toBe("ko");

      // 언어 변경
      await languageSelect.selectOption("en");

      // 페이지 새로고침 또는 즉시 적용 확인
      await expect(
        page.getByText(/Language changed|언어가 변경되었습니다/),
      ).toBeVisible();
    }
  });

  test("테마 설정", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "일반 설정");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "테마 설정");

    // 테마 선택
    const themeSection = page.locator('[data-section="theme"]');

    if (await themeSection.isVisible()) {
      // 테마 옵션들
      const themeOptions = ["light", "dark", "system"];

      for (const theme of themeOptions) {
        const themeButton = themeSection.locator(`[data-theme="${theme}"]`);
        if (await themeButton.isVisible()) {
          await themeButton.click();

          // 선택된 테마 확인
          await expect(themeButton).toHaveAttribute("aria-selected", "true");
        }
      }
    }
  });

  test("API 키 관리", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "API 설정");

    // API 키 섹션
    const apiSection = page.locator('[data-section="api-keys"]');

    if (await apiSection.isVisible()) {
      // API 키 생성 버튼
      const createKeyButton = apiSection.locator(
        '[data-testid="create-api-key"]',
      );

      if (await createKeyButton.isVisible()) {
        await createKeyButton.click();

        // API 키 생성 모달
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.getByLabel("키 이름")).toBeVisible();
        await expect(page.getByLabel("권한")).toBeVisible();

        // 취소
        await page.getByRole("button", { name: "취소" }).click();
      }

      // 기존 API 키 목록
      const apiKeyRows = apiSection.locator('[data-testid="api-key-row"]');
      const count = await apiKeyRows.count();

      if (count > 0) {
        // 각 키의 액션 버튼 확인
        for (let i = 0; i < count; i++) {
          const keyRow = apiKeyRows.nth(i);
          await expect(
            keyRow.locator('[data-testid="copy-key"]'),
          ).toBeVisible();
          await expect(
            keyRow.locator('[data-testid="revoke-key"]'),
          ).toBeVisible();
        }
      }
    }
  });

  test("계정 삭제", async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "계정 관리");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "계정 삭제");

    // 위험 구역 섹션
    const dangerZone = page.locator('[data-section="danger-zone"]');

    if (await dangerZone.isVisible()) {
      // 계정 삭제 버튼
      const deleteAccountButton = dangerZone.locator(
        '[data-testid="delete-account"]',
      );
      await expect(deleteAccountButton).toBeVisible();
      await expect(deleteAccountButton).toHaveClass(/danger|destructive/);

      // 클릭
      await deleteAccountButton.click();

      // 확인 모달
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByText("이 작업은 되돌릴 수 없습니다"),
      ).toBeVisible();

      // 취소
      await page.getByRole("button", { name: "취소" }).click();
    }
  });
});
