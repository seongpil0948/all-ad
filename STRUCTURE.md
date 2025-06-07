# All-AD Project Structure

## Overview

이 문서는 All-AD 프로젝트의 실제 구조를 반영합니다. 중복 코드 방지 및 효율적인 개발을 위해 작성되었습니다.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **State Management**: Zustand
- **UI Library**: Hero UI
- **Charts**: Apache ECharts
- **Database**: Supabase with PostgreSQL
- **Monitoring**: OpenTelemetry
- **Deployment**: Vercel
- **Icons**: react-icons

## Architecture Principles

### 1. Server-First Approach

- Server Components를 기본으로 사용
- Client Components는 상호작용이 필요한 경우에만 사용
- Server Actions를 통한 데이터 mutation

### 2. Performance Optimizations

- 초기 데이터를 서버에서 로드하여 클라이언트로 전달
- 무한 API 호출 방지를 위한 적절한 dependency 관리
- revalidatePath를 통한 효율적인 캐시 관리

### 3. Code Reusability

- 공통 컴포넌트 (LoadingState, ErrorState, MessageCard 등)
- Server Actions를 통한 비즈니스 로직 중앙화
- 플랫폼 서비스 팩토리 패턴 활용

## Actual Project Structure

```
all-ad/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # 인증 관련 라우트 그룹
│   │   ├── confirm/              # 이메일 확인
│   │   │   └── route.ts          # 확인 처리 API
│   │   ├── forgot-password/      # 비밀번호 찾기
│   │   │   ├── actions.ts        # Server Actions
│   │   │   └── page.tsx          # UI 페이지
│   │   └── login/                # 로그인 ✅ (이미 구현됨)
│   │       ├── actions.ts        # 로그인 Server Actions
│   │       └── page.tsx          # 로그인 페이지
│   │
│   ├── (private)/                # 인증 필요 라우트 그룹
│   │   ├── analytics/            # 분석 대시보드
│   │   │   └── page.tsx
│   │   ├── dashboard/            # 메인 대시보드 ✅ (Server Component로 리팩토링됨)
│   │   │   ├── actions.ts        # Server Actions (캠페인 업데이트, 동기화)
│   │   │   ├── page.tsx          # Server Component
│   │   │   └── DashboardDataProvider.tsx  # 초기 데이터 Provider
│   │   ├── integrated/           # 통합 관리
│   │   │   └── page.tsx
│   │   ├── profile/              # 사용자 프로필
│   │   │   └── page.tsx
│   │   ├── settings/             # 설정
│   │   │   ├── actions.ts
│   │   │   └── page.tsx
│   │   ├── team/                 # 팀 관리 ✅ (Server Component로 리팩토링됨)
│   │   │   ├── actions.ts        # Server Actions (팀원 초대, 권한 변경 등)
│   │   │   ├── page.tsx          # Server Component
│   │   │   └── TeamDataProvider.tsx  # 초기 데이터 Provider
│   │   └── layout.tsx            # Private 레이아웃
│   │
│   ├── api/                      # API 라우트
│   │   ├── campaigns/            # 캠페인 API
│   │   │   └── [platform]/
│   │   │       └── [campaignId]/
│   │   │           └── budget/
│   │   │               └── route.ts
│   │   ├── health/               # 헬스체크
│   │   │   ├── auth/
│   │   │   └── route.ts
│   │   └── sync/                 # 동기화 API
│   │       └── [platform]/
│   │           └── route.ts
│   │
│   ├── auth/                     # Auth 콜백
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── contact/                  # 연락처 페이지
│   ├── demo/                     # 데모 페이지
│   ├── pricing/                  # 가격 페이지
│   ├── support/                  # 지원 페이지
│   ├── error.tsx                 # 에러 바운더리
│   ├── layout.tsx                # 루트 레이아웃
│   ├── page.tsx                  # 랜딩 페이지
│   └── providers.tsx             # 전역 프로바이더
│
├── components/                    # 재사용 가능한 컴포넌트
│   ├── analytics/                # 분석 관련 컴포넌트
│   │   └── AnalyticsCharts.tsx
│   ├── auth/                     # 인증 관련 컴포넌트
│   │   └── AuthForm.tsx
│   ├── charts/                   # 차트 컴포넌트
│   │   └── echart.tsx           # ECharts 래퍼
│   ├── common/                   # 공통 컴포넌트 ✅ (확장됨)
│   │   ├── CTAButton.tsx
│   │   ├── ErrorState.tsx       # 에러 상태 컴포넌트
│   │   ├── LoadingState.tsx     # 로딩 상태 컴포넌트
│   │   ├── MessageCard.tsx      # 메시지 표시 컴포넌트
│   │   ├── MetricCard.tsx
│   │   ├── PageHeader.tsx
│   │   └── index.ts
│   ├── dashboard/                # 대시보드 컴포넌트
│   │   ├── CampaignDashboard.tsx
│   │   ├── CampaignTable.tsx
│   │   ├── DashboardStats.tsx
│   │   └── SyncButton.tsx
│   ├── home/                     # 홈페이지 컴포넌트
│   │   ├── AnimatedBackground.tsx
│   │   ├── DashboardPreview.tsx
│   │   ├── FAQSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── HeroButtons.tsx
│   │   ├── IntegrationProcessSection.tsx
│   │   ├── PlatformsSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── StatsSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   └── index.ts
│   ├── platform/                 # 플랫폼 관련 컴포넌트
│   │   ├── PlatformCredentialForm.tsx
│   │   ├── PlatformCredentials.tsx
│   │   └── PlatformCredentialsManager.tsx
│   ├── team/                     # 팀 관련 컴포넌트
│   │   ├── InviteTeamMemberModal.tsx
│   │   └── TeamManagement.tsx   # ✅ 무한 API 호출 문제 해결됨
│   ├── avatar-upload.tsx         # 아바타 업로드
│   ├── counter.tsx               # 카운터 컴포넌트
│   ├── footer.tsx                # 푸터
│   ├── navbar.tsx                # 네비게이션 바
│   ├── primitives.ts             # UI 프리미티브
│   ├── theme-switch.tsx          # 테마 전환
│   └── user-dropdown.tsx         # 사용자 드롭다운
│
├── services/                     # 비즈니스 로직 서비스
│   ├── ads/                      # 광고 서비스
│   │   └── ad-service.ts
│   ├── google-ads/               # Google Ads 통합 서비스 ✅ (새로 구현)
│   │   ├── core/                 # 핵심 모듈
│   │   │   └── google-ads-client.ts      # Google Ads API 클라이언트
│   │   ├── campaign/             # 캠페인 관리
│   │   │   └── campaign-control.service.ts   # 캠페인 제어 (ON/OFF, 예산)
│   │   ├── label/                # 라벨 관리
│   │   │   └── label-management.service.ts   # 라벨 CRUD
│   │   ├── sync/                 # 동기화
│   │   │   └── sync-strategy.service.ts      # 증분/전체 동기화
│   │   └── google-ads-integration.service.ts # 통합 인터페이스
│   ├── scheduler/                # 스케줄러 서비스 ✅ (새로 구현)
│   │   └── google-ads-scheduler.ts       # 동기화 스케줄링
│   ├── platforms/                # 플랫폼별 서비스 ✅ (이미 구현)
│   │   ├── base-platform.service.ts      # 기본 플랫폼 인터페이스
│   │   ├── google-platform.service.ts    # Google Ads ✅ (google-ads-api 통합)
│   │   ├── facebook-platform.service.ts  # Facebook Ads
│   │   ├── naver-platform.service.ts     # Naver Ads
│   │   ├── kakao-platform.service.ts     # Kakao Ads
│   │   ├── coupang-platform.service.ts   # Coupang Ads
│   │   ├── platform-service-factory.ts   # 팩토리 패턴
│   │   └── platform-service.interface.ts # 인터페이스 정의
│   ├── platform-database.service.ts      # DB 서비스
│   └── platform-sync.service.ts          # 동기화 서비스
│
├── stores/                       # Zustand 상태 관리 ✅ (Slice 패턴 적용)
│   ├── slices/                  # 재사용 가능한 상태 슬라이스 ✅ NEW
│   │   ├── loadingSlice.ts      # 로딩 상태 관리
│   │   ├── errorSlice.ts        # 에러 상태 관리
│   │   ├── authDataSlice.ts     # 인증 데이터
│   │   ├── authActionsSlice.ts  # 인증 액션
│   │   ├── campaignDataSlice.ts # 캠페인 데이터
│   │   ├── campaignFilterSlice.ts # 캠페인 필터
│   │   └── campaignActionsSlice.ts # 캠페인 액션
│   ├── useAuthStore.ts          # 인증 상태 (Slice 패턴 적용)
│   ├── useCampaignStore.ts      # 캠페인 상태 (Slice 패턴 적용)
│   ├── usePlatformStore.ts      # 플랫폼 상태
│   ├── useTeamStore.ts          # 팀 상태
│   ├── useAuthStore.old.ts      # 이전 버전 백업
│   ├── useCampaignStore.old.ts  # 이전 버전 백업
│   └── index.ts                 # 스토어 내보내기
│
├── infrastructure/              # 인프라 레이어
│   ├── adapters/               # 어댑터 패턴
│   │   └── ads/
│   │       └── google-ads-adapter.ts
│   └── monitoring/             # 모니터링
│       ├── interfaces/
│       │   └── logger.interface.ts
│       ├── logger/
│       │   └── otel-logger.ts
│       └── index.ts
│
├── domain/                     # 도메인 레이어
│   ├── ads/                   # 광고 도메인
│   └── auth/                  # 인증 도메인
│
├── lib/                        # 라이브러리 유틸리티
│   ├── di/                    # 의존성 주입 컨테이너 ✅ NEW
│   │   ├── container.ts       # DI 컨테이너 구현
│   │   ├── bootstrap.ts       # 서비스 등록 및 초기화
│   │   └── service-resolver.ts # 타입 안전한 서비스 리졸버
│   ├── oauth/                 # OAuth 관련 유틸리티 ✅ (새로 추가)
│   │   ├── oauth-manager.ts   # 서버측 OAuth 토큰 관리
│   │   ├── oauth-client.ts    # 클라이언트측 OAuth URL 생성
│   │   ├── platform-configs.ts # 서버측 OAuth 설정
│   │   └── platform-configs.client.ts # 클라이언트측 OAuth 설정
│   ├── platforms/             # 플랫폼 어댑터
│   │   ├── adapter-factory.ts
│   │   ├── base-adapter.ts
│   │   ├── google-ads-adapter.ts
│   │   ├── meta-ads-adapter.ts
│   │   ├── coupang-ads-adapter.ts
│   │   ├── platform-manager.ts
│   │   └── index.ts
│   └── redis.ts               # Redis 클라이언트 ✅ (새로 추가)
│
├── utils/                     # 유틸리티 함수
│   ├── auth-helpers/         # 인증 헬퍼
│   ├── supabase/            # Supabase 클라이언트
│   │   ├── client.ts        # 브라우저 클라이언트
│   │   ├── server.ts        # 서버 클라이언트
│   │   └── middleware.ts    # 미들웨어
│   ├── campaign-transformer.ts # 캠페인 타입 변환 ✅ NEW
│   ├── email-templates.ts    # 이메일 템플릿
│   ├── logger.ts            # 로거 유틸리티
│   └── profile.ts           # 프로필 유틸리티
│
├── types/                    # TypeScript 타입 정의
│   ├── auth.types.ts        # 인증 타입
│   ├── database.types.ts    # 데이터베이스 타입
│   ├── platform.ts          # 플랫폼 타입 ✅ (GoogleCredentials 추가)
│   ├── google-ads.types.ts  # Google Ads 타입 ✅ (새로 추가)
│   ├── env.d.ts            # 환경 변수 타입
│   └── index.ts            # 타입 내보내기
│
├── constants/               # 상수 정의
│   ├── analytics.ts        # 분석 관련 상수
│   ├── home.ts            # 홈페이지 상수
│   └── index.ts           # 상수 내보내기
│
├── hooks/                  # 커스텀 훅
│   └── use-auth.ts        # 인증 훅
│
├── docs/                   # 문서
│   └── oauth-configuration.md # OAuth 설정 가이드 ✅ (새로 추가)
│
├── config/                # 설정 파일
│   ├── fonts.ts          # 폰트 설정
│   └── site.ts           # 사이트 설정
│
├── supabase/             # Supabase 설정
│   ├── migrations/       # 데이터베이스 마이그레이션
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_fix_storage_policies.sql
│   │   ├── 003_create_platform_auth_and_campaigns.sql
│   │   ├── 004_create_team_rpc_function.sql
│   │   ├── 004a_fix_team_members_rls_recursion.sql
│   │   ├── 005a_create_team_members_profiles_function.sql
│   │   ├── 005b_fix_all_rls_recursion.sql
│   │   ├── 006_fix_team_creation.sql
│   │   ├── 008_auto_accept_invitation_on_signup.sql
│   │   ├── 009a_fix_user_role_enum_safe.sql
│   │   ├── 009b_recreate_policies_and_tables.sql
│   │   ├── 010_fix_team_creation_syntax.sql  # ✅ NEW: 팀 생성 시 SQL 문법 오류 수정
│   │   ├── 011_add_missing_columns.sql        # ✅ NEW: 누락된 컬럼 추가
│   │   ├── 012_fix_all_enums_and_functions.sql # ✅ NEW: 모든 enum 및 함수 종합 수정
│   │   ├── 013_fix_team_members_rls_recursion.sql # ✅ NEW: RLS 무한 재귀 문제 해결
│   │   ├── 014_ensure_team_functions_exist.sql # ✅ NEW: 팀 관련 함수 생성 확인
│   │   ├── 015_create_accept_invitation_function.sql # ✅ NEW: 초대 수락/거절 함수 생성
│   │   ├── 016_fix_invitation_token_access.sql
│   │   ├── 017_fix_invitation_public_access.sql
│   │   ├── 018_create_get_invitation_by_token.sql
│   │   ├── 019_add_oauth_credentials_to_platform_credentials.sql # ✅ NEW: OAuth 인증 정보 저장을 위한 컬럼 추가
│   │   └── 020_create_oauth_refresh_cron_job.sql # ✅ NEW: OAuth 토큰 자동 갱신 cron job
│   └── functions/        # Supabase Edge Functions
│       ├── resend/       # 이메일 발송 함수
│       └── refresh-oauth-tokens/ # ✅ NEW: OAuth 토큰 갱신 함수
│           ├── index.ts
│           └── deno.json
│
├── styles/              # 스타일
│   └── globals.css     # 전역 스타일
│
└── Configuration Files
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── package.json
    ├── middleware.ts    # Next.js 미들웨어
    └── instrumentation.ts # OpenTelemetry 설정
```

## 주요 리팩토링 내용

### 코드 정리 및 중복 제거 (2025-01-06)

1. **중복 타입 정의 통합**

   - `PlatformType`을 `/types/base.types.ts`에서만 정의
   - `/types/database.types.ts`에서는 import하여 사용
   - `/types/store.d.ts` 파일 제거 (실제 store 파일들과 중복)

2. **Platform 서비스 통합**

   - `/lib/platforms` 폴더 제거 (Adapter Pattern)
   - `/services/platforms`로 통일 (Service Pattern)
   - 데이터베이스 스키마와 일치하는 구조로 정리

3. **미사용 컴포넌트 제거**

   - `LoginRedirect.tsx` - 사용되지 않음
   - `counter.tsx` - 사용되지 않음
   - `CampaignTable.tsx` - CampaignDashboard에 통합됨
   - `DashboardStats.tsx` - CampaignDashboard에 통합됨
   - `PlatformCredentialForm.tsx` - PlatformCredentialsManager에 직접 구현
   - `PlatformCredentials.tsx` - 사용되지 않음
   - `InviteTeamMemberModal.tsx` - TeamManagement에 직접 구현

4. **구조 정리 효과**
   - 약 7개의 미사용 컴포넌트 제거
   - 중복된 타입 정의 통합으로 일관성 향상
   - Platform 서비스 구조 단순화
   - 코드베이스 크기 감소 및 유지보수성 향상

### 프로젝트 구조 정리 (2025-01-06)

1. **Store 폴더 통합**

   - `/store`와 `/stores` 폴더가 중복되어 있던 문제 해결
   - 모든 상태 관리 파일을 `/stores` 폴더로 통합
   - 사용되지 않던 `/store` 폴더 제거

2. **Logger Import 통일**

   - 모든 파일에서 `import log from "@/utils/logger"` 형식으로 통일
   - 기존의 `import { Logger } from "@/utils/logger"` 패턴을 모두 변경
   - `Logger.info()` → `log.info()` 형식으로 사용법 통일

3. **코드 정리 효과**
   - 중복 코드 제거로 프로젝트 구조 단순화
   - import 방식 통일로 일관성 향상
   - 유지보수성 개선

## 주요 리팩토링 내용 (2025-01-06)

### 코드베이스 리팩토링 (2025-01-07)

1. **코드 품질 개선**

   - Supabase Edge Function에서 console.log 제거
   - 모든 컴포넌트에서 Hero UI 일관성 있게 사용
   - API 라우트에서 공통 response helper 사용
   - 서버 컴포넌트 패턴 적용 (forgot-password 페이지)
   - 공통 LoadingState/ErrorState 컴포넌트 사용

2. **타입 정의 중앙화**

   - 컴포넌트 props 인터페이스를 `/types/components.d.ts`로 이동
   - 인라인 타입 정의 제거
   - 타입 import 방식 통일

3. **UI 컴포넌트 업데이트**
   - MessageCard: Hero UI Button 사용 (onClick → onPress)
   - PlatformsSection: Hero UI Card 사용
   - 커스텀 Spinner 대신 LoadingState 컴포넌트 사용

### Google Ads API 통합 강화 (2025-01-07)

1. **Google Ads 전문 서비스 구조**

   - `/services/google-ads/` - Google Ads 전용 서비스 모듈
   - `core/google-ads-client.ts` - Google Ads API 클라이언트
   - `campaign/campaign-control.service.ts` - 캠페인 제어 서비스
   - `label/label-management.service.ts` - 라벨 관리 서비스
   - `sync/sync-strategy.service.ts` - 동기화 전략 서비스
   - `google-ads-integration.service.ts` - 통합 서비스

2. **데이터베이스 스키마 확장**

   - `sync_logs` 테이블 추가 - 동기화 이력 추적
   - 플랫폼별 동기화 상태 관리
   - 에러 추적 및 성능 모니터링

3. **OAuth 콜백 개선**

   - `/app/api/auth/callback/google-ads/route.ts` - OAuth Manager 통합
   - 토큰 자동 교환 및 저장
   - 통합 대시보드로 리다이렉트

4. **컴포넌트 추가**

   - `GoogleAdsIntegration.tsx` - Google Ads 연동 UI 컴포넌트
   - `google-ads-actions.ts` - Server Actions for OAuth flow

5. **API 엔드포인트 구현**
   - 캠페인 상태 토글 (`/api/campaigns/[platform]/[campaignId]/status`)
   - 예산 업데이트 (`/api/campaigns/[platform]/[campaignId]/budget`)
   - 플랫폼별 동기화 (`/api/sync/[platform]`)

### OAuth 인증 사용자 제공 방식으로 변경 (2025-01-06)

1. **사용자별 OAuth 앱 지원**

   - 환경 변수 대신 각 팀이 자체 OAuth 앱 생성
   - platform_credentials 테이블에 OAuth 인증 정보 저장
   - 각 플랫폼별 OAuth 앱 설정 가이드 제공

2. **업데이트된 컴포넌트**

   - `PlatformCredentialForm`: OAuth 앱 정보 입력 필드 추가 + 리디렉션 URI 표시
   - `PlatformCredentialsManager`: OAuth 흐름 업데이트 + 수동 토큰 입력 지원
   - OAuth 콜백 라우트들: 팀별 저장된 인증 정보 사용

3. **수동 토큰 입력 옵션**

   - OAuth 연동 실패 시 대체 방안으로 수동 토큰 입력 지원
   - Google: Refresh Token 직접 입력 가능
   - Facebook: Access Token 직접 입력 가능
   - Kakao: Refresh Token 직접 입력 가능

4. **Supabase Cron Job 통합**

   - CRON_SECRET 제거하고 Supabase 내부 cron 사용
   - Edge Function으로 토큰 자동 갱신 구현
   - pg_cron을 통한 시간별 토큰 갱신

5. **보안 개선사항**
   - OAuth 인증 정보는 credentials 컬럼에 안전하게 저장
   - 토큰은 Redis에 저장 (또는 DB의 data 필드)
   - 팀별 격리된 인증 정보 관리

## 주요 리팩토링 내용 (2025-01-06) - 대규모 코드베이스 개선

### 1. 중복 파일 제거 및 코드 정리

- **제거된 중복 파일**:
  - `/app/page-refactored.tsx`
  - `/app/(auth)/login/page-refactored.tsx`
  - `/app/(private)/analytics/page-refactored.tsx`
  - 빈 디렉토리 정리 완료

### 2. 타입 정의 통합 및 정리

- **새로 생성된 타입 파일**:

  - `/types/store.d.ts` - 모든 Store 인터페이스 통합
  - `/types/oauth.d.ts` - OAuth 관련 타입
  - `/types/components.d.ts` - 컴포넌트 Props 타입
  - `/types/actions.d.ts` - Server Actions 타입
  - `/types/config.d.ts` - 설정 타입
  - `/types/email.d.ts` - 이메일 템플릿 타입
  - `/types/redis.d.ts` - Redis 타입

- **타입 정의 이동**:
  - 20개 이상의 inline 타입 정의를 `/types` 폴더로 이동
  - 모든 타입은 `.d.ts` 파일로 관리

### 3. 의존성 주입(DI) 컨테이너 구현

- **DI 시스템 구축**:

  - `/lib/di/container.ts` - DI 컨테이너 구현
  - `/lib/di/bootstrap.ts` - 서비스 등록 및 초기화
  - `/lib/di/service-resolver.ts` - 타입 안전한 서비스 리졸버

- **서비스 레이어 리팩토링**:
  - `PlatformServiceFactory` - DI 패턴 적용
  - `PlatformSyncService` - 의존성 주입으로 변경
  - `PlatformDatabaseService` - 생성자 주입 패턴 적용

### 4. Store 구조 개선 - Slice 패턴 도입

- **Slice 패턴 구현**:

  - `/stores/slices/` 폴더에 재사용 가능한 slice들 생성
  - `loadingSlice`, `errorSlice` - 공통 상태 관리
  - `campaignDataSlice`, `campaignFilterSlice`, `campaignActionsSlice` - 캠페인 관련
  - `authDataSlice`, `authActionsSlice` - 인증 관련

- **Store 리팩토링**:
  - `useCampaignStore` - slice 패턴으로 완전 재구현
  - `useAuthStore` - slice 패턴 적용
  - 기존 파일은 `.old.ts`로 백업

### 5. Server Components 최적화

- **서버 컴포넌트로 변환**:
  - `/app/pricing/page.tsx` - 서버 컴포넌트 + `PricingButton` 클라이언트 컴포넌트
  - `/app/contact/page.tsx` - 서버 컴포넌트 + `ContactForm` 클라이언트 컴포넌트
  - `/app/support/page.tsx` - 완전 서버 컴포넌트
  - `/app/demo/page.tsx` - 서버 컴포넌트 + `DemoButton` 클라이언트 컴포넌트
  - `/app/error/page.tsx` - 완전 서버 컴포넌트

### 6. API 엔드포인트 추가

- **새로운 API 라우트**:
  - `/api/campaigns` - 캠페인 조회 API
  - `/api/sync` - 전체 플랫폼 동기화 API
  - 클라이언트 스토어에서 서버 함수 직접 호출 제거

### 7. 유틸리티 추가

- **Campaign Transformer**:
  - `/utils/campaign-transformer.ts` - DB 타입과 앱 타입 간 변환
  - snake_case ↔ camelCase 변환 처리

## 주요 리팩토링 내용 (2024-01-08)

### Google Ads API 통합 구현 (2024-01-08)

1. **google-ads-api 패키지 활용**

   - 공식 Google Ads API 클라이언트 라이브러리 사용
   - OAuth 2.0 인증 구현
   - MCC(Manager Customer Center) 계정 지원

2. **모듈화된 서비스 아키텍처**

   - **GoogleAdsClient**: 핵심 API 클라이언트
   - **CampaignControlService**: 캠페인 ON/OFF, 예산 관리
   - **LabelManagementService**: 라벨 기반 캠페인 그룹 관리
   - **GoogleAdsSyncService**: 증분/전체 동기화 전략
   - **GoogleAdsIntegrationService**: 통합 인터페이스

3. **핵심 기능 구현**

   - 캠페인 상태 제어 (ON/OFF) - 최우선 기능
   - 캠페인 예산 업데이트
   - 라벨 기반 일괄 캠페인 관리
   - 증분 동기화 (시간당 1회)
   - 전체 동기화 (일 1회)
   - Bull 큐를 통한 비동기 처리

4. **타입 안전성 강화**

   - `google-ads.types.ts` 추가
   - 모든 Google Ads 관련 타입 정의
   - 플랫폼 공통 타입과의 매핑

5. **기존 서비스 통합**
   - `google-platform.service.ts`가 새로운 통합 서비스 활용
   - 기존 인터페이스 유지하면서 내부 구현 개선

### 2. Server Components 도입

- **Team 페이지**: 서버에서 초기 데이터를 로드하고 TeamDataProvider를 통해 클라이언트로 전달
- **Dashboard 페이지**: 캠페인 데이터와 통계를 서버에서 계산하여 전달
- **장점**:
  - 초기 로딩 속도 향상
  - SEO 개선
  - 클라이언트 번들 크기 감소

### 3. Server Actions 활용

- **Team Actions** (`/app/(private)/team/actions.ts`):

  - `inviteTeamMemberAction`: 팀원 초대
  - `updateTeamMemberRoleAction`: 권한 변경
  - `removeTeamMemberAction`: 팀원 제거
  - `createTeamForUserAction`: 팀 생성

- **Dashboard Actions** (`/app/(private)/dashboard/actions.ts`):
  - `updateCampaignBudgetAction`: 캠페인 예산 업데이트
  - `toggleCampaignStatusAction`: 캠페인 상태 토글
  - `syncAllCampaignsAction`: 전체 동기화

### 4. 공통 컴포넌트 확장

- **LoadingState**: 로딩 상태 표시 컴포넌트
- **ErrorState**: 에러 상태 표시 컴포넌트
- **MessageCard**: 성공/에러/정보 메시지 통합 컴포넌트

### 5. 상태 관리 개선

- **useTeamStore**:
  - `setInitialData` 함수 추가로 서버 데이터 초기화
- **useCampaignStore**:
  - `setCampaigns`와 `setStats` 함수 추가
  - 통계 계산 로직 통합

## 개발 가이드라인

### 1. Server Component 우선 원칙

```typescript
// ✅ 좋은 예: Server Component로 시작
export default async function PageName() {
  const data = await fetchData();

  return (
    <DataProvider initialData={data}>
      <ClientComponent />
    </DataProvider>
  );
}

// ❌ 나쁜 예: 불필요한 Client Component
"use client";
export default function PageName() {
  useEffect(() => {
    fetchData();
  }, []);
}
```

### 2. Server Actions 사용

```typescript
// ✅ 좋은 예: Server Action 사용
async function updateData(formData: FormData) {
  "use server";
  // 서버에서 데이터 업데이트
  revalidatePath("/path");
}

// ❌ 나쁜 예: 클라이언트에서 직접 API 호출
const updateData = async () => {
  await fetch("/api/update", { method: "POST" });
};
```

### 3. 무한 렌더링 방지

```typescript
// ✅ 좋은 예: 적절한 dependency 관리
useEffect(() => {
  if (!isInitialized) {
    fetchData();
    setIsInitialized(true);
  }
}, [isInitialized]);

// ❌ 나쁜 예: 함수를 dependency로 사용
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData가 매번 재생성되면 무한 호출
```

### 4. 공통 컴포넌트 활용

```typescript
// ✅ 좋은 예: 공통 컴포넌트 사용
import { LoadingState, ErrorState, MessageCard } from "@/components/common";

if (isLoading) return <LoadingState />;
if (error) return <ErrorState message={error} />;
if (success) return <MessageCard type="success" message={success} />;

// ❌ 나쁜 예: 매번 새로 작성
if (isLoading) {
  return <div>로딩 중...</div>;
}
```

## 이미 구현된 주요 기능

### 1. 인증 시스템 ✅

- 이메일 기반 로그인
- 비밀번호 찾기
- 이메일 확인

### 2. 플랫폼 통합 시스템 ✅

- Google Ads
- Facebook Ads
- Naver Ads
- Kakao Ads
- Coupang Ads

### 3. 대시보드 및 분석 ✅

- 통합 캠페인 관리
- 실시간 예산 편집
- 캠페인 상태 관리
- 전체 플랫폼 동기화

### 4. 팀 관리 기능 ✅

- 팀원 초대/제거
- 권한 관리 (master, editor, viewer)
- 자동 마스터 지정

### 5. 모니터링 시스템 ✅

- OpenTelemetry 통합
- 구조화된 로깅

## 성능 최적화 팁

1. **서버 컴포넌트 활용**: 가능한 모든 곳에서 Server Component 사용
2. **데이터 프리로딩**: 서버에서 필요한 데이터를 미리 로드
3. **캐시 활용**: Next.js의 캐시 메커니즘 활용
4. **번들 크기 최적화**: 동적 임포트와 코드 스플리팅 활용
5. **이미지 최적화**: Next.js Image 컴포넌트 사용

## 주의사항

- ❌ 비슷한 기능의 중복 컴포넌트 생성 금지
- ❌ 클라이언트 컴포넌트 남용 금지
- ❌ 무한 렌더링을 일으킬 수 있는 패턴 주의
- ✅ 기존 컴포넌트와 서비스 최대한 재활용
- ✅ Server Actions를 통한 데이터 mutation
- ✅ 에러 처리와 로딩 상태 관리 철저히
