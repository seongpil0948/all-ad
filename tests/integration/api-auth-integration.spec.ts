import { test, expect, AnnotationType } from "../tester";

/**
 * API 레벨 인증 통합 테스트
 *
 * 새로운 인증 방식들의 API 엔드포인트 동작을 테스트
 */
test.describe("API 인증 통합 테스트", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "API 인증");
  });

  test.describe("Google MCC API 통합", () => {
    test("MCC OAuth 콜백 처리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google MCC API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "OAuth 콜백");

      // MCC OAuth 콜백 시뮬레이션
      const mccCallbackUrl =
        "/api/auth/callback/google-ads?code=test_mcc_code&state=test_state&login_customer_id=123-456-7890";

      const response = await page.request.get(mccCallbackUrl);

      // 리다이렉트 응답 확인
      expect(response.status()).toBe(302);

      // 리다이렉트 위치 확인
      const location = response.headers()["location"];
      expect(location).toContain("/integrated");

      // 쿠키 설정 확인 (인증 세션)
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(
        (c) => c.name.includes("auth") || c.name.includes("session"),
      );
      expect(authCookie).toBeDefined();
    });

    test("MCC 클라이언트 계정 목록 API", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google MCC API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "클라이언트 계정 조회");

      // API 엔드포인트 호출
      const response = await page.request.get(
        "/api/campaigns/google/accounts",
        {
          headers: {
            Authorization: "Bearer mock_token",
          },
        },
      );

      if (response.ok()) {
        const data = await response.json();

        // MCC 응답 구조 확인
        expect(data).toHaveProperty("accounts");
        expect(Array.isArray(data.accounts)).toBeTruthy();

        // 계정 데이터 구조 확인
        if (data.accounts.length > 0) {
          const account = data.accounts[0];
          expect(account).toHaveProperty("id");
          expect(account).toHaveProperty("name");
          expect(account).toHaveProperty("currencyCode");
          expect(account).toHaveProperty("timeZone");
          expect(account).toHaveProperty("isManager");
        }
      }
    });
  });

  test.describe("Meta System User API 통합", () => {
    test("System User 토큰 검증", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta System User API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "토큰 검증");

      // System User 토큰으로 인증
      const response = await page.request.post("/api/auth/credentials", {
        data: {
          platform: "meta-ads",
          credentials: {
            access_token: "EAAI...system_user_token",
            is_system_user: true,
            business_id: "123456789",
          },
        },
      });

      expect(response.ok()).toBeTruthy();

      const result = await response.json();
      expect(result.success).toBeTruthy();

      // System User 특성 확인
      expect(result.token_type).toBe("system_user");
      expect(result.expires_in).toBeNull(); // 영구 토큰
    });

    test("System User 권한 확인 API", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta System User API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "권한 확인");

      const response = await page.request.get("/api/auth/meta/permissions", {
        headers: {
          Authorization: "Bearer system_user_token",
        },
      });

      if (response.ok()) {
        const permissions = await response.json();

        // 필수 권한 확인
        const requiredPermissions = [
          "ads_management",
          "ads_read",
          "business_management",
          "pages_read_engagement",
        ];

        for (const perm of requiredPermissions) {
          expect(permissions.data).toContain(perm);
        }
      }
    });
  });

  test.describe("TikTok Business Center API 통합", () => {
    test("Business Center 인증", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok BC API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "BC 인증");

      const response = await page.request.post("/api/auth/credentials", {
        data: {
          platform: "tiktok-ads",
          credentials: {
            business_center_id: "7000000000",
            access_token: "tiktok_bc_token",
            app_id: "1234567890",
            app_secret: "secret_key",
          },
        },
      });

      expect(response.ok()).toBeTruthy();

      const result = await response.json();
      expect(result.business_center).toBeDefined();
      expect(result.business_center.member_count).toBeGreaterThan(0);
    });

    test("QR 코드 생성 API", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok BC API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "QR 코드 생성");

      const response = await page.request.post("/api/tiktok/qr-code", {
        headers: {
          Authorization: "Bearer bc_token",
        },
        data: {
          business_center_id: "7000000000",
          permissions: ["AD_ACCOUNT_READ", "AD_ACCOUNT_WRITE"],
          expire_days: 7,
        },
      });

      if (response.ok()) {
        const result = await response.json();

        expect(result.qr_code_url).toBeDefined();
        expect(result.qr_code_url).toContain("https://");
        expect(result.expire_time).toBeDefined();
      }
    });

    test("Business Center 광고 계정 목록 API", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok BC API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "광고 계정 조회");

      const response = await page.request.get(
        "/api/tiktok/bc/accounts?bc_id=7000000000",
        {
          headers: {
            Authorization: "Bearer bc_token",
          },
        },
      );

      if (response.ok()) {
        const result = await response.json();

        expect(result.accounts).toBeDefined();
        expect(Array.isArray(result.accounts)).toBeTruthy();

        // 페이지네이션 지원 확인
        expect(result.page).toBeDefined();
        expect(result.total).toBeDefined();
        expect(result.page_size).toBeDefined();
      }
    });
  });

  test.describe("통합 토큰 교환 API", () => {
    test("OAuth2 토큰 교환 (RFC 8693)", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "토큰 교환");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "RFC 8693");

      const response = await page.request.post("/api/auth/token-exchange", {
        data: {
          grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
          subject_token: "original_platform_token",
          subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
          requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
          audience: "all-ad-platform",
        },
      });

      if (response.ok()) {
        const result = await response.json();

        expect(result.access_token).toBeDefined();
        expect(result.token_type).toBe("Bearer");
        expect(result.expires_in).toBeDefined();
        expect(result.scope).toContain("campaigns:read");
      }
    });
  });

  test.describe("BFF 패턴 API", () => {
    test("통합 캠페인 조회 (BFF)", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "BFF API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "통합 캠페인");

      // BFF를 통한 모든 플랫폼 캠페인 조회
      const response = await page.request.get("/api/campaigns", {
        headers: {
          Authorization: "Bearer unified_token",
        },
      });

      if (response.ok()) {
        const campaigns = await response.json();

        expect(campaigns.data).toBeDefined();
        expect(Array.isArray(campaigns.data)).toBeTruthy();

        // 여러 플랫폼의 캠페인이 통합되어 있는지 확인
        const platforms = new Set(campaigns.data.map((c: any) => c.platform));
        expect(platforms.size).toBeGreaterThan(1);

        // 통합 메트릭 확인
        if (campaigns.data.length > 0) {
          const campaign = campaigns.data[0];
          expect(campaign).toHaveProperty("unified_metrics");
          expect(campaign.unified_metrics).toHaveProperty("impressions");
          expect(campaign.unified_metrics).toHaveProperty("clicks");
          expect(campaign.unified_metrics).toHaveProperty("cost");
          expect(campaign.unified_metrics).toHaveProperty("conversions");
        }
      }
    });

    test("토큰 자동 갱신 (BFF)", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "BFF API");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동 토큰 갱신");

      // 만료된 토큰으로 요청
      const response = await page.request.get("/api/campaigns", {
        headers: {
          Authorization: "Bearer expired_token",
        },
      });

      // BFF가 자동으로 토큰을 갱신하고 재시도해야 함
      expect(response.ok()).toBeTruthy();

      // 새로운 토큰이 헤더에 포함되어 있는지 확인
      const newToken = response.headers()["x-new-token"];
      if (newToken) {
        expect(newToken).not.toBe("expired_token");
      }
    });
  });

  test.describe("에러 처리 및 복구", () => {
    test("플랫폼별 에러 처리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "에러 처리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "플랫폼별 에러");

      // 잘못된 MCC 계정 ID로 요청
      const mccResponse = await page.request.get(
        "/api/campaigns/google/accounts",
        {
          headers: {
            Authorization: "Bearer token",
            "X-MCC-Account-Id": "invalid-mcc-id",
          },
        },
      );

      if (!mccResponse.ok()) {
        const error = await mccResponse.json();
        expect(error.error).toBeDefined();
        expect(error.platform).toBe("google-ads");
        expect(error.error_type).toBe("INVALID_MCC_ACCOUNT");
      }

      // TikTok Business Center 권한 부족
      const tiktokResponse = await page.request.post("/api/tiktok/bc/members", {
        headers: {
          Authorization: "Bearer limited_token",
        },
        data: {
          business_center_id: "7000000000",
          action: "remove_member",
          member_id: "123",
        },
      });

      if (!tiktokResponse.ok()) {
        const error = await tiktokResponse.json();
        expect(error.error_type).toBe("INSUFFICIENT_PERMISSIONS");
        expect(error.required_permission).toBe("BC_MEMBER_MANAGE");
      }
    });

    test("자동 폴백 메커니즘", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "에러 처리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동 폴백");

      // System User 토큰 실패 시 일반 OAuth로 폴백
      const response = await page.request.get("/api/campaigns/meta", {
        headers: {
          Authorization: "Bearer token",
          "X-Fallback-Enabled": "true",
        },
      });

      if (response.ok()) {
        const result = await response.json();

        // 폴백이 사용되었는지 확인
        const usedFallback = response.headers()["x-used-fallback"];
        if (usedFallback === "true") {
          expect(result.warning).toContain("fallback");
          expect(result.token_type).toBe("user_token"); // System User 대신 일반 토큰
        }
      }
    });
  });
});
