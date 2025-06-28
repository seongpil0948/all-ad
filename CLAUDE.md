# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### 작업 전후 (필수!) 작업

- 작업전 테스트 코드를 먼저 생성 또는 수정하여 목적을 확실히 해야해
- 작업 후 (pnpm typecheck && pnpm test:e2e && pnpm format && pnpm lint) 를 통해 문제가 없음을 증명해야해
- 만약 작업후 테스트코드가 잘못된거라면 수정하고 아니면 어플리케이션 코드를 수정해야해
- 작업 후 미사용 코드나 잘못된 코드가 없는지 확인후 리팩토링해줘

## Project Overview

Next.js 15 multi-tenant advertising platform integrating multiple ad platforms (Facebook, Google, Kakao, Naver, Coupang) into a unified dashboard. Server-first architecture with Supabase backend.

### Working Directory

```
/Users/2309-n0015/Code/Project/all-ad
```

### Core Guidelines

- API 연동 문서는 `/docs` 디렉토리 참조
- 플랫폼별 여러 계정 연동 지원 필요
- 작업 전 STRUCTURE.md 확인하여 중복 방지
- 작업 후: `pnpm format`, `pnpm lint`, `pnpm build` 검증
- Playwright 테스트 코드 최신화 필수
- 이메일 기반 로그인/회원가입 시스템 구현됨
- 재사용 가능 코드는 `components` 또는 `utils`에 저장
- 아이콘: react-icons 사용
- 로깅: `import log from "@/utils/logger"` 사용 (console.log 금지)

### 기술 스택

- **Frontend**: Next.js 15 (App Router), Zustand, Hero UI
- **Charts**: Apache ECharts
- **Deployment**: Vercel
- **Backend**: Supabase with PostgreSQL

### 기술적 요구사항

- 서버 컴포넌트 우선, Server Actions 활용
- 모듈화 및 재사용성 극대화
- Dependency Injection, Inversion of Control 패턴 적용
- UI는 Hero UI 사용 (HTML/Tailwind 최소화)
- 모든 테이블은 Infinite Scroll 구현
- 중복 코드 제거 및 구조 최적화

### Type Management

- 타입은 `/types/*.d.ts`로 관리
- DB 타입: `supabase gen types typescript --linked > types/supabase.types.ts`

### Store Pattern

- 모든 store는 `/stores` 폴더에 위치
- Slice-Store 패턴으로 재사용성 확보

## Development Commands

```bash
pnpm install           # Install dependencies
npm run dev           # Development server
npm run build         # Production build
npm run lint          # Lint with auto-fix
npm run format        # Format code
npm run gen:type:supabase  # Generate types from Supabase
```

## Architecture Patterns

### Server-First Clean Architecture

- **Server Components**: Default for data fetching
- **Server Actions**: All mutations via `actions.ts`
- **Client Components**: Only for interactivity
- **Data Flow**: Server → DataProvider → Client → Zustand

### Key Architectural Decisions

1. **Platform Abstraction**
   - Interface: `/services/platforms/platform-service.interface.ts`
   - Factory: `/services/platforms/platform-service-factory.ts`

2. **Auth & Authorization**
   - Supabase Auth with RLS
   - Roles: master, team_mate, viewer
   - Middleware handles sessions

3. **State Management**
   - Zustand for client state
   - Server state via Server Components

## Database Schema

Core tables with RLS:

- `profiles`: User profiles
- `teams`: Organizations
- `team_members`: Role-based permissions
- `platform_credentials`: Encrypted API credentials
- `campaigns`: Unified campaign data

## Common Tasks

### Adding New Platform

1. Create service in `/services/platforms/{platform}-platform.service.ts`
2. Implement `PlatformService` interface
3. Register in `PlatformServiceFactory`
4. Add platform type to enums

### Server Actions Pattern

```typescript
// app/.../actions.ts
export async function actionName(data: FormData) {
  const supabase = await createClient();
  // Check permissions
  // Perform operation
  // Revalidate paths
  return { success: true } or { error: "message" }
}
```

## Korean Platform Integration Guide

### Kakao Moment API

- OAuth2 authentication required
- Access needs official permission
- Rate limits: 5-second intervals
- Max 31 days per report request

### Naver Search Ads

- Direct key authentication
- No official SDK (custom development needed)
- Conservative rate limiting recommended

### Coupang

- No public API
- Manual management only
- Consider automation workarounds

## Google Ads Integration

### Authentication (Simplified OAuth)

All-AD now uses its own OAuth credentials, eliminating the need for users to input Client IDs:

1. **User Flow**:
   - Click "Google Ads 연동하기" button
   - Redirected to Google OAuth consent screen
   - Approve permissions
   - Automatically redirected back with account connected

2. **OAuth Route**: `/api/auth/google-ads`
3. **Callback Route**: `/api/auth/callback/google-ads`
4. **Service**: `GoogleAdsOAuthPlatformService` (when env vars are set)

### Key Services

- `GoogleAdsOAuthClient`: Handles automatic token refresh
- `GoogleAdsOAuthIntegrationService`: Simplified API interface
- Campaign Control with ON/OFF toggle
- Automatic token management

## Multi-Platform Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Gateway   │────▶│ Transformation   │────▶│ Data Warehouse  │
│ (Rate Limiting) │     │     Layer        │     │ (Unified Schema)│
└────────┬────────┘     └──────────────────┘     └─────────┬───────┘
         │                                                   │
┌─────────────────┐                               ┌─────────────────┐
│Platform Adapters│                               │Reporting Dashboard│
└─────────────────┘                               └─────────────────┘
```

## User Workflows

### 1. 신규 사용자 온보딩

1. 회원가입 → 이메일 인증
2. 광고 계정 연동 안내
3. 플랫폼 선택 및 OAuth 인증
4. 데이터 동기화
5. 대시보드 확인

### 2. 캠페인 관리

- 통합 캠페인 목록에서 ON/OFF 토글
- 확인 모달 → API 상태 변경
- 실시간 피드백

### 3. 팀 협업

- Master: 모든 권한
- Team Mate: 캠페인 편집 권한
- Viewer: 읽기 전용

## Pricing Model (V1.0)

- **초기**: 완전 무료
- **지원 플랫폼**: Google Ads, Meta Ads
- **팀원**: 최대 5명
- **API 제한**: 시간당 1회 업데이트

## Security Considerations

- Platform credentials encrypted in DB
- RLS policies enforce team isolation
- Server actions include permission checks
- No client-side external API calls

## Implementation Tips

### Error Handling

```javascript
const retryConfig = {
  kakao: { maxRetries: 3, backoff: 5000 },
  naver: { maxRetries: 5, backoff: 1000 },
  coupang: { maxRetries: 0 }, // Manual only
};
```

### Data Normalization

```javascript
const metricMappings = {
  kakao: { impressions: "impCnt", clicks: "clickCnt" },
  naver: { impressions: "impressions", clicks: "clicks" },
};
```

## Infinite Scroll Table Pattern

Use the provided infinite scroll implementation with:

- `useSWRInfinite` for data fetching
- IntersectionObserver for automatic loading
- Hero UI Table components
- Proper error and loading states

## Redis Integration

```typescript
import { createClient } from "redis";
const redis = await createClient({ url: process.env.REDIS_URL }).connect();
```

---

_Made by Seongpil_
