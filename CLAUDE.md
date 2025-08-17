# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### 작업 전후 (필수!) 작업

- 작업전 테스트 코드를 먼저 생성 또는 수정하여 목적을 확실히 해야해
- 작업 후 (pnpm typecheck && pnpm format && pnpm lint && pnpm test:unit) 를 통해 문제가 없음을 증명해야해
- 만약 작업후 테스트코드가 잘못된거라면 수정하고 아니면 어플리케이션 코드를 수정해야해
- 작업 후 미사용 코드나 잘못된 코드가 없는지 확인후 리팩토링작업이 이루어져야해 즉 모든 코드는 참조되고 사용되고 있어야만 해

### 로컬 개발 환경 (2025.02 업데이트)

- **로컬 Supabase 필수**: 모든 개발과 테스트는 로컬 Supabase 환경에서 진행
- **마이그레이션 기반 개발**: 모든 DB 변경사항은 마이그레이션 파일로 관리
- **테스트 우선**: pgTAP으로 DB 테스트, Playwright로 통합/E2E 테스트
- **독립적 테스트**: 각 테스트는 고유 ID를 사용하여 독립적으로 실행

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
- Playwright 테스트 코드 최신화 필수, 선택자는 무조건 `data-testid` 사용
- 이메일 기반 로그인/회원가입 시스템 구현됨
- 재사용 가능 코드는 `components` 또는 `utils`에 저장
- 아이콘: react-icons 사용
- 로깅: `import log from "@/utils/logger"` 사용 (console.log 금지)

### Internationalization (i18n)

- **Client Components**: Use the `useDictionary` hook to access the dictionary.

  ```typescript
  import { useDictionary } from "@/hooks/use-dictionary";

  const { dictionary } = useDictionary();
  // ...
  <h1>{dictionary.some.text}</h1>
  ```

- **Server Components**: Use the `getDictionary` function to get the dictionary.

  ```typescript
  import { getDictionary } from "@/app/[lang]/dictionaries";

  const dictionary = await getDictionary(locale);
  // ...
  <h1>{dictionary.some.text}</h1>
  ```

-

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
# Installation & Setup
pnpm install                    # Install dependencies
npx supabase start              # Start local Supabase
npx supabase db reset           # Reset database with migrations

# Development
npm run dev                     # Development server
npm run build                   # Production build
npm run lint                    # Lint with auto-fix
npm run format                  # Format code
npm run typecheck               # Type checking
npm run gen:type:supabase       # Generate types from Supabase

# Testing
npx supabase test db           # Database tests (pgTAP)
pnpm test:unit                 # Unit tests
pnpm test:integration          # Integration tests
pnpm test:unit                 # Fast smoke tests
pnpm test:e2e                  # E2E tests

# Sharding (for faster CI execution)
pnpm test:shard:1              # Run shard 1 of 4
pnpm test:shard:2              # Run shard 2 of 4
pnpm test:shard:3              # Run shard 3 of 4
pnpm test:shard:4              # Run shard 4 of 4
pnpm test:merge-reports        # Merge sharded reports

## Testing Guidelines (Updated 2025)

### Testing Philosophy
- **Domain-Driven Testing**: Use actual Supabase types (`Tables["campaigns"]["Row"]`) instead of custom test types
- **Accessibility First**: All UI tests must validate ARIA attributes and screen reader compatibility
- **Real Component Testing**: Test actual components, not mock HTML structures
- **Independent Tests**: Each test uses unique IDs and runs in isolation
- **Sharding Support**: Tests can be split across multiple workers for faster execution

### Test Structure
```

tests/
├── unit/ # Pure function tests, utility testing
├── components/ # UI component tests with ARIA validation
├── scenarios/ # End-to-end user journey tests
├── fixtures/ # Test data using actual domain types
└── helpers/ # Shared test utilities and mocks

````

### Component Testing Standards
- **HeroUI Components**: All tests must validate HeroUI accessibility features
- **ARIA Requirements**: Test `role`, `aria-label`, `aria-expanded`, etc.
- **Keyboard Navigation**: Tab order, Enter/Space activation, focus management
- **Screen Reader Support**: Proper labeling, grouping, and semantic markup
- **Responsive Behavior**: Mobile and desktop viewport testing

### Component Testing Approaches

**1. Playwright Component Testing (mount fixture)**
For isolated component testing with real components:
```typescript
import { test, expect } from "@playwright/experimental-ct-react";
import { UserDropdown } from "@/components/user-dropdown";

test("should render and be accessible", async ({ mount }) => {
  const component = await mount(<UserDropdown />);

  // Test visibility and accessibility
  const button = component.locator("button");
  await expect(button).toBeVisible();

  // Test interaction
  await button.click();
  const menu = component.locator('[role="menu"]');
  await expect(menu).toBeVisible();
});
```

**2. E2E Testing (page navigation)**
For full page integration testing:
```typescript
test("should work in dashboard context", async ({ page }) => {
  await page.goto("/dashboard");
  const component = page.locator('[data-testid="user-dropdown"]');
  await expect(component).toBeVisible({ timeout: 10000 });

  // Test accessibility
  const hasAriaAttributes = await component.evaluate((el) => ({
    hasAriaHaspopup: el.hasAttribute('aria-haspopup'),
    isInteractive: el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'
  }));
  expect(hasAriaAttributes.isInteractive).toBe(true);
});
```

### Commands
- Component tests: `pnpm test:component`
- E2E tests: `pnpm test:e2e`
- All tests: `pnpm test:all`

### Data Factory Pattern

Use `TestDataFactory` with actual Supabase types:

```typescript
// ✅ Correct: Use actual domain types
const campaign = testDataFactory.generateCampaign(teamId, {
  platform: "google" as Database["public"]["Enums"]["platform_type"],
  name: "Test Campaign"
});

// ❌ Incorrect: Custom test types
interface TestCampaign { ... }
```

### Test Selectors

- **Required**: Always use `data-testid` attributes
- **Format**: `data-testid="component-action"` (kebab-case)
- **Examples**: `data-testid="user-dropdown"`, `data-testid="campaign-status-toggle"`

### Accessibility Testing Checklist

- [ ] All interactive elements have proper ARIA labels
- [ ] Focus management works correctly
- [ ] Keyboard navigation follows expected patterns
- [ ] Screen reader announcements are descriptive
- [ ] Color contrast meets WCAG standards
- [ ] Images have alt text or are marked decorative

### Mock Data Guidelines

- Use `testDataFactory` for consistent test data generation
- Platform responses should match actual API structures
- Timestamps and IDs must be unique per test run
- Mock only external APIs, not internal application logic

# Supabase Management

npx supabase status # Check local Supabase status
npx supabase migration new # Create new migration
npx supabase db push # Push migrations to remote

````

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

- `profiles`: User profiles (auto-created on signup)
- `teams`: Organizations (auto-created on signup)
- `team_members`: Role-based permissions (master, team_mate, viewer)
- `team_invitations`: Team invitation system
- `platform_credentials`: Encrypted API credentials
- `campaigns`: Unified campaign data
- `campaign_metrics`: Performance metrics
- `activity_logs`: Audit trail

### Local Development Database

```bash
# Start local Supabase
npx supabase start

# Access local Studio
open http://localhost:54323

# Reset database (applies all migrations)
npx supabase db reset

# Create new migration
npx supabase migration new <name>

# Run database tests
npx supabase test db
```

## Common Tasks

### Adding New Platform (Updated Process)

1. **Create Platform Service**:

   ```typescript
   // services/platforms/{platform}-platform.service.ts
   export class YourPlatformService extends BasePlatformService<YourApiClient> {
     platform: PlatformType = "your_platform";

     async testConnection(): Promise<ConnectionTestResult> {
       /* implement */
     }
     async refreshToken(): Promise<TokenRefreshResult> {
       /* implement */
     }
     async getAccountInfo(): Promise<AccountInfo> {
       /* implement */
     }
     // ... other required methods
   }
   ```

2. **Register in Factory**:

   ```typescript
   // services/platforms/platform-service-factory.ts
   this.services.set("your_platform", () => new YourPlatformService());
   ```

3. **Add Platform Type**:

   ```sql
   -- Add to Supabase enum
   ALTER TYPE platform_type ADD VALUE 'your_platform';
   ```

4. **Add OAuth Configuration**:

   ```typescript
   // lib/oauth/platform-configs.ts
   your_platform: {
     clientId: process.env.YOUR_PLATFORM_CLIENT_ID,
     clientSecret: process.env.YOUR_PLATFORM_CLIENT_SECRET,
   }
   ```

5. **Update Environment Variables**:
   ```bash
   YOUR_PLATFORM_CLIENT_ID=your_client_id
   YOUR_PLATFORM_CLIENT_SECRET=your_client_secret
   ```

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

## Platform Integration Architecture (2024.12 Updated)

### Enhanced Platform Service Architecture

All advertising platforms now use a unified service architecture:

1. **Base Platform Service**: `BasePlatformService<T>` - Common error handling, retry logic
2. **Platform-Specific Services**: Extend base service with platform implementations
3. **Unified Interface**: All platforms implement `PlatformService` interface
4. **Factory Pattern**: `PlatformServiceFactory` for service creation and management

### Core Platform Services

#### Google Ads Integration

- **Service**: `GoogleAdsOAuthPlatformService`
- **OAuth Flow**: Simplified with environment variables (no user config needed)
- **Features**: Campaign management, budget control, real-time metrics
- **Environment Variables**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

#### Meta (Facebook) Ads Integration

- **Service**: `FacebookPlatformService`
- **OAuth Flow**: Simplified with project credentials
- **Features**: Campaign management, batch operations, account insights
- **Environment Variables**: `META_APP_ID`, `META_APP_SECRET`, `META_BUSINESS_ID`

#### Amazon Ads Integration

- **Service**: `AmazonPlatformService`
- **OAuth Flow**: Region-aware authentication
- **Features**: Multi-region support, keyword management, product targets
- **Environment Variables**: `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`

### Platform Service Interface

All platform services implement the following standard interface:

```typescript
interface PlatformService {
  // Connection Management
  testConnection(): Promise<ConnectionTestResult>;
  validateCredentials(): Promise<boolean>;
  refreshToken(): Promise<TokenRefreshResult>;
  getAccountInfo(): Promise<AccountInfo>;

  // Campaign Operations
  fetchCampaigns(): Promise<Campaign[]>;
  fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]>;
  updateCampaignStatus(campaignId: string, isActive: boolean): Promise<boolean>;
  updateCampaignBudget(campaignId: string, budget: number): Promise<boolean>;

  // Lifecycle
  cleanup?(): Promise<void>;
}
```

### Error Handling & Retry Logic

All platform services use enhanced error handling:

```typescript
// Platform-specific error types
class PlatformError extends Error {
  platform: PlatformType;
  code: string;
  retryable: boolean;
  userMessage: string;
}

// Automatic retry with exponential backoff
await service.executeWithErrorHandling(async () => {
  // Platform operation
}, "operationName");
```

### Authentication Flows

1. **Simplified OAuth**: Users only need to authenticate, no app configuration required
2. **Environment-based Credentials**: All platform app credentials from environment variables
3. **Automatic Token Refresh**: Background token management with error handling
4. **Multi-Account Support**: Team-based credential isolation

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

## Implementation Tips (Updated 2024.12)

### Enhanced Error Handling

```typescript
// Platform-specific error handling with retry logic
class PlatformAuthError extends PlatformError {
  retryable = true; // Auth errors are retryable
}

class PlatformRateLimitError extends PlatformError {
  retryable = true; // Rate limits are retryable with backoff
}

class PlatformConfigError extends PlatformError {
  retryable = false; // Config errors are not retryable
}

// Usage in platform services
await this.executeWithErrorHandling(async () => {
  // Your platform operation
}, "operationName");
```

### Data Normalization & Transformation

```typescript
// Unified metrics interface
interface CampaignMetrics {
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  revenue?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  roas?: number;
  roi?: number;
  raw_data: unknown;
  created_at: string;
}

// Platform-specific transformation
protected parseMetricsResponse(data: any): CampaignMetrics {
  return {
    campaign_id: data.campaign_id,
    date: data.date,
    impressions: Number(data.impressions) || 0,
    clicks: Number(data.clicks) || 0,
    cost: Number(data.cost) || 0,
    conversions: Number(data.conversions) || 0,
    ctr: data.ctr ? Number(data.ctr) / 100 : 0,
    raw_data: data,
    created_at: new Date().toISOString(),
  };
}
```

### Platform Service Testing

```typescript
// Test connection and credentials
const connectionTest = await service.testConnection();
if (!connectionTest.success) {
  console.error("Connection failed:", connectionTest.error);
}

// Validate credentials before operations
const isValid = await service.validateCredentials();
if (!isValid) {
  // Handle invalid credentials
}
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
