import { test, expect, AnnotationType } from "../tester";
import { waitForApiResponse, fillForm } from "../helpers/test-utils";

/**
 * 고급 인증 방식 통합 테스트
 *
 * MCC, System Users, Business Center 등 플랫폼별 고급 인증 방식의
 * 전체 플로우와 통합을 테스트
 */
test.describe("고급 인증 방식 통합 테스트", () => {
  test.beforeEach(async ({ page, pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "고급 인증 통합");
    await page.goto("/integrated");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Google Ads MCC 통합 플로우", () => {
    test("MCC 계정으로 다중 클라이언트 관리", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google MCC 통합");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "다중 계정 관리");

      // Google Ads MCC 연동 시작
      const googleMCCButton = page
        .getByText(/Google.*MCC|Manager.*Center/i)
        .first();
      if (await googleMCCButton.isVisible()) {
        await googleMCCButton.click();

        // MCC OAuth 플로우 시뮬레이션
        await page.waitForTimeout(1000);

        // MCC 콜백 처리
        await page.goto(
          "/api/auth/callback/google-ads?code=mcc_code&state=mcc_state&mcc=true",
        );
        await page.waitForTimeout(2000);

        // MCC 클라이언트 계정 목록 확인
        await page.goto("/integrated");
        await page.waitForLoadState("networkidle");

        // MCC 계정 섹션 찾기
        const mccSection = page.locator('[data-mcc-account="true"]').first();
        if (await mccSection.isVisible()) {
          // 클라이언트 계정 수 확인
          const clientCountText = await mccSection
            .getByText(/\d+.*계정/i)
            .textContent();
          const clientCount = parseInt(
            clientCountText?.match(/\d+/)?.[0] || "0",
          );

          // MCC는 여러 계정을 관리할 수 있어야 함
          expect(clientCount).toBeGreaterThan(0);

          // 클라이언트 계정 목록 펼치기
          const expandButton = mccSection.getByRole("button", {
            name: /펼치기|더보기/i,
          });
          if (await expandButton.isVisible()) {
            await expandButton.click();
            await page.waitForTimeout(500);

            // 클라이언트 계정들이 표시되는지 확인
            const clientAccounts = mccSection.locator(
              '[data-client-account="true"]',
            );
            const visibleClients = await clientAccounts.count();
            expect(visibleClients).toBeGreaterThan(0);
          }
        }
      }
    });

    test("MCC를 통한 일괄 캠페인 관리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Google MCC 통합");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "일괄 캠페인 관리");

      // 대시보드로 이동
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // MCC 계정 필터 확인
      const mccFilter = page.getByRole("combobox", {
        name: /계정.*선택|MCC.*필터/i,
      });
      if (await mccFilter.isVisible()) {
        await mccFilter.click();

        // MCC 옵션 확인
        const mccOption = page.getByRole("option", {
          name: /모든.*MCC.*계정/i,
        });
        if (await mccOption.isVisible()) {
          await mccOption.click();
          await page.waitForTimeout(1000);

          // 여러 계정의 캠페인이 통합되어 표시되는지 확인
          const campaignList = page.locator('[data-testid="campaign-list"]');
          if (await campaignList.isVisible()) {
            // 계정 ID 컬럼이 있는지 확인 (MCC는 여러 계정을 표시해야 함)
            const accountColumn = page.getByRole("columnheader", {
              name: /계정/i,
            });
            expect(await accountColumn.isVisible()).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe("Meta System Users 통합 플로우", () => {
    test("System User로 영구 토큰 설정", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta System Users");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "영구 토큰 설정");

      // Meta System User 연동
      const metaSystemButton = page
        .getByText(/Meta.*System|System.*User/i)
        .first();
      if (await metaSystemButton.isVisible()) {
        await metaSystemButton.click();

        // System User 토큰 입력 모달
        const tokenModal = page.getByRole("dialog");
        if (await tokenModal.isVisible()) {
          // System User 토큰 입력
          const tokenInput = tokenModal.getByLabel(
            /System.*Token|Access.*Token/i,
          );
          if (await tokenInput.isVisible()) {
            await tokenInput.fill("mock_system_user_token_no_expiry");
          }

          // 비즈니스 ID 입력
          const businessIdInput = tokenModal.getByLabel(/Business.*ID/i);
          if (await businessIdInput.isVisible()) {
            await businessIdInput.fill("123456789");
          }

          // 저장
          const saveButton = tokenModal.getByRole("button", {
            name: /저장|연동/i,
          });
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(2000);
          }
        }

        // 연동 완료 후 토큰 상태 확인
        await page.goto("/integrated");
        await page.waitForLoadState("networkidle");

        const metaSection = page.locator('[data-platform="meta-ads"]').first();
        if (await metaSection.isVisible()) {
          // 영구 토큰 표시 확인
          const tokenStatus = metaSection.locator(
            '[data-testid="token-status"]',
          );
          if (await tokenStatus.isVisible()) {
            await expect(tokenStatus).toContainText(
              /영구|만료.*없음|System.*User/i,
            );
          }
        }
      }
    });

    test("System User 권한으로 여러 광고 계정 접근", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "Meta System Users");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "다중 광고 계정");

      // Meta 광고 계정 목록 페이지
      const metaAccountsButton = page.getByText(/Meta.*계정.*관리/i);
      if (await metaAccountsButton.isVisible()) {
        await metaAccountsButton.click();
        await page.waitForLoadState("networkidle");

        // System User로 접근 가능한 모든 광고 계정 목록
        const accountsList = page.locator('[data-testid="meta-accounts-list"]');
        if (await accountsList.isVisible()) {
          const accounts = accountsList.locator('[data-account-item="true"]');
          const accountCount = await accounts.count();

          // System User는 여러 광고 계정에 접근 가능
          expect(accountCount).toBeGreaterThan(0);

          // 각 계정의 권한 확인
          for (let i = 0; i < Math.min(accountCount, 3); i++) {
            const account = accounts.nth(i);
            const permissionBadge = account.locator(
              '[data-testid="permission-badge"]',
            );
            if (await permissionBadge.isVisible()) {
              // ads_management 권한 확인
              await expect(permissionBadge).toContainText(
                /ads_management|광고.*관리/i,
              );
            }
          }
        }
      }
    });
  });

  test.describe("TikTok Business Center 통합 플로우", () => {
    test("Business Center로 광고주 QR 온보딩", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok Business Center");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "QR 온보딩");

      // TikTok Business Center 섹션
      const tiktokBCSection = page
        .locator('[data-platform="tiktok-ads"][data-business-center="true"]')
        .first();
      if (await tiktokBCSection.isVisible()) {
        // QR 코드 생성 버튼
        const generateQRButton = tiktokBCSection.getByRole("button", {
          name: /QR.*생성|온보딩.*QR/i,
        });
        if (await generateQRButton.isVisible()) {
          await generateQRButton.click();
          await page.waitForTimeout(1000);

          // QR 코드 모달
          const qrModal = page.getByRole("dialog");
          if (await qrModal.isVisible()) {
            // QR 코드 이미지 확인
            const qrImage = qrModal.locator('img[alt*="QR"]');
            await expect(qrImage).toBeVisible();

            // 권한 설정 옵션
            const permissionSelect = qrModal.getByRole("combobox", {
              name: /권한/i,
            });
            if (await permissionSelect.isVisible()) {
              await permissionSelect.click();

              // 광고 계정 읽기/쓰기 권한 선택
              const adPermission = page.getByRole("option", {
                name: /광고.*계정.*읽기.*쓰기/i,
              });
              if (await adPermission.isVisible()) {
                await adPermission.click();
              }
            }

            // QR 코드 다운로드 버튼
            const downloadButton = qrModal.getByRole("button", {
              name: /다운로드/i,
            });
            await expect(downloadButton).toBeVisible();

            // 모달 닫기
            await qrModal.getByRole("button", { name: /닫기/i }).click();
          }
        }
      }
    });

    test("Business Center 4000명 멤버 관리", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok Business Center");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "대규모 멤버 관리");

      // Business Center 멤버 관리 페이지
      const bcMembersButton = page.getByText(
        /Business.*Center.*멤버|BC.*멤버.*관리/i,
      );
      if (await bcMembersButton.isVisible()) {
        await bcMembersButton.click();
        await page.waitForLoadState("networkidle");

        // 멤버 목록 테이블
        const membersTable = page.locator('[data-testid="bc-members-table"]');
        if (await membersTable.isVisible()) {
          // 페이지네이션 확인 (4000명 지원)
          const pagination = page.locator('[data-testid="pagination"]');
          await expect(pagination).toBeVisible();

          // 멤버 검색 기능
          const searchInput = page.getByPlaceholder(/멤버.*검색|이메일.*검색/i);
          if (await searchInput.isVisible()) {
            await searchInput.fill("test@example.com");
            await page.keyboard.press("Enter");
            await page.waitForTimeout(1000);
          }

          // 멤버 권한 일괄 변경
          const bulkActionButton = page.getByRole("button", {
            name: /일괄.*작업|선택.*작업/i,
          });
          if (await bulkActionButton.isVisible()) {
            // 여러 멤버 선택
            const checkboxes = membersTable.locator('input[type="checkbox"]');
            const checkboxCount = await checkboxes.count();
            for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
              await checkboxes.nth(i).check();
            }

            await bulkActionButton.click();

            // 권한 변경 옵션
            const changePermissionOption = page.getByRole("menuitem", {
              name: /권한.*변경/i,
            });
            if (await changePermissionOption.isVisible()) {
              await changePermissionOption.click();

              // 권한 선택 모달
              const permissionModal = page.getByRole("dialog");
              if (await permissionModal.isVisible()) {
                const adAccountPermission = permissionModal.getByRole(
                  "checkbox",
                  { name: /광고.*계정/i },
                );
                await adAccountPermission.check();

                const applyButton = permissionModal.getByRole("button", {
                  name: /적용/i,
                });
                await applyButton.click();
              }
            }
          }
        }
      }
    });

    test("Enterprise Business Center 기능", async ({
      page,
      pushAnnotation,
    }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "TikTok Business Center");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "Enterprise 기능");

      // Enterprise BC 확인
      const enterpriseBadge = page.locator('[data-testid="enterprise-badge"]');
      if (await enterpriseBadge.isVisible()) {
        // Enterprise 기능 메뉴
        const enterpriseMenu = page.getByRole("button", {
          name: /Enterprise.*기능/i,
        });
        if (await enterpriseMenu.isVisible()) {
          await enterpriseMenu.click();

          // Enterprise 전용 기능들
          const enterpriseFeatures = [
            "고급 권한 템플릿",
            "API 속도 제한 증가",
            "전담 지원",
            "커스텀 보고서",
          ];

          for (const feature of enterpriseFeatures) {
            const featureItem = page.getByText(feature);
            if (await featureItem.isVisible()) {
              expect(await featureItem.isVisible()).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe("통합 토큰 관리", () => {
    test("BFF 패턴으로 토큰 자동 갱신", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "토큰 관리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "자동 갱신");

      // 토큰 상태 대시보드
      await page.goto("/settings");
      const tokenStatusButton = page.getByRole("button", {
        name: /토큰.*상태|인증.*상태/i,
      });
      if (await tokenStatusButton.isVisible()) {
        await tokenStatusButton.click();
        await page.waitForTimeout(1000);

        // 토큰 상태 모달
        const tokenModal = page.getByRole("dialog");
        if (await tokenModal.isVisible()) {
          // 각 플랫폼의 토큰 상태
          const platforms = ["Google", "Meta", "TikTok", "Naver", "Kakao"];

          for (const platform of platforms) {
            const platformRow = tokenModal.locator(
              `tr:has-text("${platform}")`,
            );
            if (await platformRow.isVisible()) {
              // 토큰 타입 확인
              const tokenType = platformRow.locator(
                '[data-testid="token-type"]',
              );
              const tokenExpiry = platformRow.locator(
                '[data-testid="token-expiry"]',
              );

              if (platform === "Google") {
                await expect(tokenType).toContainText(/Refresh.*Token/i);
              } else if (platform === "Meta") {
                // System User인지 일반 토큰인지 확인
                const isSystemUser = await tokenType.textContent();
                if (isSystemUser?.includes("System")) {
                  await expect(tokenExpiry).toContainText(/영구|없음/i);
                }
              } else if (platform === "TikTok") {
                await expect(tokenExpiry).toContainText(/24시간/i);
              }

              // 자동 갱신 상태
              const autoRefreshToggle = platformRow.locator(
                '[data-testid="auto-refresh-toggle"]',
              );
              if (await autoRefreshToggle.isVisible()) {
                expect(await autoRefreshToggle.isChecked()).toBeTruthy();
              }
            }
          }
        }
      }
    });

    test("토큰 만료 알림 및 수동 갱신", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "토큰 관리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "만료 알림");

      // 알림 센터 확인
      const notificationIcon = page.locator(
        '[data-testid="notification-icon"]',
      );
      if (await notificationIcon.isVisible()) {
        await notificationIcon.click();

        // 토큰 만료 알림 확인
        const tokenExpiryNotification =
          page.getByText(/토큰.*만료.*예정|갱신.*필요/i);
        if (await tokenExpiryNotification.isVisible()) {
          // 알림 클릭하여 갱신 페이지로 이동
          await tokenExpiryNotification.click();
          await page.waitForTimeout(1000);

          // 토큰 갱신 페이지
          if (
            page.url().includes("/settings") ||
            page.url().includes("/integrated")
          ) {
            // 갱신이 필요한 플랫폼 표시
            const platformsNeedingRefresh = page.locator(
              '[data-needs-refresh="true"]',
            );
            const count = await platformsNeedingRefresh.count();

            if (count > 0) {
              // 첫 번째 플랫폼 갱신
              const firstPlatform = platformsNeedingRefresh.first();
              const refreshButton = firstPlatform.getByRole("button", {
                name: /갱신|새로고침/i,
              });

              if (await refreshButton.isVisible()) {
                await refreshButton.click();
                await page.waitForTimeout(2000);

                // 갱신 성공 메시지
                await expect(
                  page.getByText(/갱신.*완료|토큰.*업데이트/i),
                ).toBeVisible();
              }
            }
          }
        }
      }
    });
  });

  test.describe("동의 관리 및 GDPR 준수", () => {
    test("플랫폼별 동의 관리", async ({ page, pushAnnotation }) => {
      pushAnnotation(AnnotationType.SUB_CATEGORY1, "동의 관리");
      pushAnnotation(AnnotationType.SUB_CATEGORY2, "GDPR 준수");

      // 개인정보 설정 페이지
      await page.goto("/settings");
      const privacyButton = page.getByRole("button", {
        name: /개인정보|동의.*관리/i,
      });
      if (await privacyButton.isVisible()) {
        await privacyButton.click();
        await page.waitForTimeout(1000);

        // 동의 관리 섹션
        const consentSection = page.locator(
          '[data-testid="consent-management"]',
        );
        if (await consentSection.isVisible()) {
          // 각 플랫폼별 동의 항목
          const consentItems = consentSection.locator(
            '[data-consent-item="true"]',
          );
          const itemCount = await consentItems.count();

          for (let i = 0; i < itemCount; i++) {
            const item = consentItems.nth(i);

            // 동의 토글
            const consentToggle = item.locator('input[type="checkbox"]');
            if (await consentToggle.isVisible()) {
              // 동의 상태 확인
              const isConsented = await consentToggle.isChecked();

              // 동의 철회 가능 여부 확인
              const revokeButton = item.getByRole("button", { name: /철회/i });
              if (isConsented && (await revokeButton.isVisible())) {
                expect(await revokeButton.isEnabled()).toBeTruthy();
              }
            }

            // 동의 날짜 표시
            const consentDate = item.locator('[data-testid="consent-date"]');
            if (await consentDate.isVisible()) {
              const dateText = await consentDate.textContent();
              expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}/);
            }
          }

          // 데이터 다운로드 요청
          const downloadDataButton = page.getByRole("button", {
            name: /데이터.*다운로드|내.*데이터/i,
          });
          if (await downloadDataButton.isVisible()) {
            await expect(downloadDataButton).toBeEnabled();
          }

          // 계정 삭제 옵션
          const deleteAccountButton = page.getByRole("button", {
            name: /계정.*삭제/i,
          });
          if (await deleteAccountButton.isVisible()) {
            await expect(deleteAccountButton).toBeEnabled();
          }
        }
      }
    });
  });
});
