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
│   ├── platforms/                # 플랫폼별 서비스 ✅ (이미 구현)
│   │   ├── base-platform.service.ts      # 기본 플랫폼 인터페이스
│   │   ├── google-platform.service.ts    # Google Ads
│   │   ├── facebook-platform.service.ts  # Facebook Ads
│   │   ├── naver-platform.service.ts     # Naver Ads
│   │   ├── kakao-platform.service.ts     # Kakao Ads
│   │   ├── coupang-platform.service.ts   # Coupang Ads
│   │   ├── platform-service-factory.ts   # 팩토리 패턴
│   │   └── platform-service.interface.ts # 인터페이스 정의
│   ├── platform-database.service.ts      # DB 서비스
│   └── platform-sync.service.ts          # 동기화 서비스
│
├── stores/                       # Zustand 상태 관리 ✅ (개선됨)
│   ├── useAuthStore.ts          # 인증 상태
│   ├── useCampaignStore.ts      # 캠페인 상태 (setCampaigns, setStats 추가)
│   ├── usePlatformStore.ts      # 플랫폼 상태
│   ├── useTeamStore.ts          # 팀 상태 (setInitialData 추가)
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
├── utils/                     # 유틸리티 함수
│   ├── auth-helpers/         # 인증 헬퍼
│   ├── supabase/            # Supabase 클라이언트
│   │   ├── client.ts        # 브라우저 클라이언트
│   │   ├── server.ts        # 서버 클라이언트
│   │   └── middleware.ts    # 미들웨어
│   ├── logger.ts            # 로거 유틸리티
│   └── profile.ts           # 프로필 유틸리티
│
├── types/                    # TypeScript 타입 정의
│   ├── auth.types.ts        # 인증 타입
│   ├── database.types.ts    # 데이터베이스 타입
│   ├── platform.ts          # 플랫폼 타입
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
├── config/                # 설정 파일
│   ├── fonts.ts          # 폰트 설정
│   └── site.ts           # 사이트 설정
│
├── supabase/             # Supabase 설정
│   └── migrations/       # 데이터베이스 마이그레이션
│       ├── 001_create_profiles.sql
│       ├── 002_fix_storage_policies.sql
│       └── 003_create_platform_auth_and_campaigns.sql
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

## 주요 리팩토링 내용 (2024-01-08)

### 1. 무한 API 호출 문제 해결

- **문제**: TeamManagement 컴포넌트에서 useEffect의 dependency로 함수가 포함되어 무한 렌더링 발생
- **해결**:
  - 초기화 상태 플래그 추가 (`isInitialized`)
  - useCallback 훅 사용으로 함수 재생성 방지
  - dependency 최적화

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
