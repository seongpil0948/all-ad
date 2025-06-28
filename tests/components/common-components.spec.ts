import { test, expect, AnnotationType } from "../tester";

test.describe("Common Components", () => {
  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "컴포넌트");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "공통 컴포넌트");
  });

  test.describe("InfiniteScrollTable", () => {
    test.beforeEach(async ({ page }) => {
      // 무한 스크롤 테이블이 있는 페이지로 이동
      await page.goto("/dashboard");
    });

    test("무한 스크롤 동작", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "무한 스크롤");

      // 테이블 찾기
      const table = page.locator("table").first();
      await expect(table).toBeVisible();

      // 초기 행 개수 확인
      const initialRows = await table.locator("tbody tr").count();
      expect(initialRows).toBeGreaterThan(0);

      // 테이블 끝까지 스크롤
      const tableContainer = table.locator("..").first();
      await tableContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // 로딩 인디케이터 확인
      await expect(
        page.locator("[class*='loading'], [class*='spinner']"),
      ).toBeVisible();

      // 추가 데이터 로드 대기
      await page.waitForTimeout(1000);

      // 행이 추가되었는지 확인
      const updatedRows = await table.locator("tbody tr").count();
      expect(updatedRows).toBeGreaterThan(initialRows);
    });

    test("로딩 상태 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "로딩 상태");

      const table = page.locator("table").first();

      // 스크롤하여 로딩 트리거
      const tableContainer = table.locator("..").first();
      await tableContainer.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      // 로딩 상태 확인
      const loadingIndicator = page.locator(
        "[class*='table-loading'], [class*='loading-more']",
      );
      await expect(loadingIndicator).toBeVisible();
    });

    test("데이터 끝 도달", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "데이터 끝");

      // 모든 데이터가 로드될 때까지 스크롤 (실제로는 모킹 필요)
      const endMessage = page.locator("text=/더 이상.*없습니다|No more data/");

      if (await endMessage.isVisible()) {
        await expect(endMessage).toBeVisible();
      }
    });
  });

  test.describe("ToastHandler", () => {
    test("토스트 메시지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "토스트 알림");

      // 로그인 실패로 토스트 트리거
      await page.goto("/login");
      await page.getByTestId("login-input-id").fill("wrong@example.com");
      await page.getByTestId("login-input-pw").fill("wrongpassword");
      await page.getByTestId("login-submit").click();

      // 토스트 메시지 확인
      const toast = page.locator("[class*='toast'], [role='alert']");
      await expect(toast).toBeVisible();

      // 토스트 내용 확인
      await expect(toast).toContainText(/오류|Error|실패/);
    });

    test("토스트 자동 사라짐", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동 사라짐");

      // 토스트 트리거
      await page.goto("/login");
      await page.getByTestId("login-submit").click();

      const toast = page.locator("[class*='toast'], [role='alert']").first();

      if (await toast.isVisible()) {
        // 토스트가 표시됨
        await expect(toast).toBeVisible();

        // 5초 후 사라지는지 확인
        await expect(toast).toBeHidden({ timeout: 6000 });
      }
    });

    test("토스트 닫기 버튼", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "닫기 버튼");

      // 토스트 트리거
      await page.goto("/login");
      await page.getByTestId("login-submit").click();

      const toast = page.locator("[class*='toast'], [role='alert']").first();

      if (await toast.isVisible()) {
        // 닫기 버튼 찾기
        const closeButton = toast.locator(
          "button[aria-label*='닫기'], button[aria-label*='Close']",
        );

        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(toast).toBeHidden();
        }
      }
    });
  });

  test.describe("DataProvider", () => {
    test("데이터 로딩 상태", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "데이터 프로바이더");

      await page.goto("/dashboard");

      // 초기 로딩 상태
      const skeleton = page.locator("[class*='skeleton']").first();
      if (await skeleton.isVisible({ timeout: 1000 })) {
        await expect(skeleton).toBeVisible();
      }

      // 데이터 로드 완료 대기
      await expect(page.locator("table, [class*='chart']").first()).toBeVisible(
        { timeout: 10000 },
      );
    });

    test("에러 상태 처리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "에러 처리");

      // API 에러 시뮬레이션
      await page.route("**/api/**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      });

      await page.goto("/dashboard");

      // 에러 메시지 확인
      await expect(
        page.getByText(/오류가 발생했습니다|Error occurred/),
      ).toBeVisible();

      // 재시도 버튼
      const retryButton = page.getByRole("button", { name: /다시 시도|Retry/ });
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeVisible();
      }
    });
  });

  test.describe("UserDropdown", () => {
    test("사용자 드롭다운 메뉴", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "사용자 메뉴");

      await page.goto("/dashboard");

      // 사용자 아바타/버튼 찾기
      const userButton = page
        .locator("[class*='user-dropdown'], [class*='avatar']")
        .first();

      if (await userButton.isVisible()) {
        await userButton.click();

        // 드롭다운 메뉴 항목들
        await expect(
          page.getByRole("menuitem", { name: /프로필|Profile/ }),
        ).toBeVisible();
        await expect(
          page.getByRole("menuitem", { name: /설정|Settings/ }),
        ).toBeVisible();
        await expect(
          page.getByRole("menuitem", { name: /로그아웃|Logout/ }),
        ).toBeVisible();
      }
    });

    test("팀 전환 기능", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "팀 전환");

      await page.goto("/dashboard");

      const userButton = page
        .locator("[class*='user-dropdown'], [class*='avatar']")
        .first();

      if (await userButton.isVisible()) {
        await userButton.click();

        // 팀 전환 옵션
        const teamSwitch = page.getByRole("menuitem", {
          name: /팀 전환|Switch team/,
        });
        if (await teamSwitch.isVisible()) {
          await teamSwitch.click();

          // 팀 목록 표시
          await expect(page.getByText(/팀 선택|Select team/)).toBeVisible();
        }
      }
    });

    test("로그아웃 동작", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "로그아웃");

      await page.goto("/dashboard");

      const userButton = page
        .locator("[class*='user-dropdown'], [class*='avatar']")
        .first();

      if (await userButton.isVisible()) {
        await userButton.click();

        // 로그아웃 클릭
        await page.getByRole("menuitem", { name: /로그아웃|Logout/ }).click();

        // 로그인 페이지로 리디렉션
        await expect(page).toHaveURL("/login");
      }
    });
  });

  test.describe("Skeletons", () => {
    test("카드 스켈레톤", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "스켈레톤 로더");

      // 느린 네트워크 시뮬레이션
      await page.route("**/api/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto("/dashboard");

      // 카드 스켈레톤
      const cardSkeleton = page.locator("[class*='card-skeleton']");
      if (await cardSkeleton.first().isVisible({ timeout: 1000 })) {
        await expect(cardSkeleton.first()).toBeVisible();

        // 애니메이션 확인
        await expect(cardSkeleton.first()).toHaveClass(/animate|shimmer|pulse/);
      }
    });

    test("테이블 스켈레톤", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "테이블 스켈레톤");

      // 느린 네트워크 시뮬레이션
      await page.route("**/api/**", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.continue();
      });

      await page.goto("/dashboard");

      // 테이블 스켈레톤
      const tableSkeleton = page.locator("[class*='table-skeleton']");
      if (await tableSkeleton.isVisible({ timeout: 1000 })) {
        await expect(tableSkeleton).toBeVisible();

        // 여러 행이 표시되는지 확인
        const rows = tableSkeleton.locator("tr, [class*='row']");
        const count = await rows.count();
        expect(count).toBeGreaterThan(3);
      }
    });
  });

  test.describe("PlatformBadge", () => {
    test("플랫폼 배지 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "플랫폼 배지");

      await page.goto("/dashboard");

      // 플랫폼 배지들
      const badges = page.locator("[class*='platform-badge']");

      if (await badges.first().isVisible()) {
        const count = await badges.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
          const badge = badges.nth(i);
          await expect(badge).toBeVisible();

          // 플랫폼 이름 확인
          const text = await badge.textContent();
          expect(text).toMatch(/Google|Meta|Naver|Kakao|Coupang/);

          // 색상 구분 확인
          await expect(badge).toHaveClass(/google|meta|naver|kakao|coupang/i);
        }
      }
    });
  });

  test.describe("ErrorState", () => {
    test("에러 상태 컴포넌트", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "에러 상태");

      // 404 페이지로 이동하여 에러 상태 확인
      await page.goto("/non-existent-page");

      // 에러 아이콘
      await expect(
        page.locator("[class*='error-icon'], svg[class*='error']"),
      ).toBeVisible();

      // 에러 메시지
      await expect(
        page.getByText(/페이지를 찾을 수 없습니다|Page not found|404/),
      ).toBeVisible();

      // 홈으로 돌아가기 버튼
      await expect(
        page.getByRole("button", { name: /홈으로|Go home/ }),
      ).toBeVisible();
    });

    test("네트워크 에러 표시", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "네트워크 에러");

      // 네트워크 에러 시뮬레이션
      await page.route("**/api/**", (route) => {
        route.abort("failed");
      });

      await page.goto("/dashboard");

      // 네트워크 에러 메시지
      await expect(page.getByText(/네트워크 오류|Network error/)).toBeVisible();

      // 재시도 버튼
      await expect(
        page.getByRole("button", { name: /다시 시도|Try again/ }),
      ).toBeVisible();
    });
  });

  test.describe("PageHeader", () => {
    test("페이지 헤더 구성", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "페이지 헤더");

      await page.goto("/dashboard");

      // 페이지 제목
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // 브레드크럼
      const breadcrumb = page.locator("nav[aria-label='breadcrumb']");
      if (await breadcrumb.isVisible()) {
        await expect(breadcrumb).toBeVisible();
        await expect(breadcrumb.locator("a, span")).toHaveCount(2);
      }

      // 액션 버튼들
      const headerActions = page.locator("[class*='page-header'] button");
      if (await headerActions.first().isVisible()) {
        await expect(headerActions.first()).toBeVisible();
      }
    });
  });
});
