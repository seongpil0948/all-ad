# All-AD 아키텍처 업데이트 (2024년 12월)

이 문서는 2024년 12월에 수행된 주요 아키텍처 업데이트 사항을 설명합니다.

## 🚀 주요 변경 사항

### 1. 플랫폼 서비스 아키텍처 통합

#### 변경 전

- 플랫폼별로 상이한 인터페이스
- 일관성 없는 에러 처리
- 중복된 코드 구조

#### 변경 후

- 통합된 `PlatformService` 인터페이스
- `BasePlatformService<T>` 추상 클래스로 공통 로직 통합
- 일관된 에러 처리 및 재시도 로직

### 2. 환경 변수 표준화

#### Meta (Facebook) Ads 환경 변수 변경

```diff
- META_CLIENT_ID
- META_CLIENT_SECRET
+ META_APP_ID
+ META_APP_SECRET
+ META_BUSINESS_ID
```

#### 표준화된 환경 변수 구조

- Google Ads: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Amazon Ads: `AMAZON_CLIENT_ID`, `AMAZON_CLIENT_SECRET`
- Meta Ads: `META_APP_ID`, `META_APP_SECRET`, `META_BUSINESS_ID`

### 3. 통합 플랫폼 서비스 인터페이스

```typescript
interface PlatformService {
  // 연결 관리
  testConnection(): Promise<ConnectionTestResult>;
  validateCredentials(): Promise<boolean>;
  refreshToken(): Promise<TokenRefreshResult>;
  getAccountInfo(): Promise<AccountInfo>;

  // 캠페인 작업
  fetchCampaigns(): Promise<Campaign[]>;
  fetchCampaignMetrics(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CampaignMetrics[]>;
  updateCampaignStatus(campaignId: string, isActive: boolean): Promise<boolean>;
  updateCampaignBudget(campaignId: string, budget: number): Promise<boolean>;

  // 생명주기
  cleanup?(): Promise<void>;
}
```

### 4. 향상된 에러 처리

#### 새로운 에러 타입 체계

```typescript
abstract class PlatformError extends Error {
  abstract readonly platform: PlatformType;
  abstract readonly code: string;
  abstract readonly userMessage: string;
  abstract readonly retryable: boolean;
}

// 구체적인 에러 타입들
class PlatformAuthError extends PlatformError
class PlatformRateLimitError extends PlatformError
class PlatformConfigError extends PlatformError
```

#### 자동 재시도 로직

- 지수 백오프를 사용한 재시도
- 플랫폼별 재시도 가능 에러 구분
- 상세한 에러 로깅

### 5. 팩토리 패턴 구현

#### PlatformServiceFactory

```typescript
export class PlatformServiceFactory {
  createService(platform: PlatformType): PlatformService;
  createIntegrationService(platform: PlatformType): PlatformIntegrationService;

  // 편의 메서드들
  createAndInitializeService(
    platform: PlatformType,
    credentials: PlatformCredentials,
  ): Promise<PlatformService>;
  isPlatformSupported(platform: PlatformType): boolean;
  getPlatformInfo(platform: PlatformType): PlatformInfo;
}
```

## 📁 파일 구조 변경

### 새로 추가된 파일들

```
services/platforms/
├── base-platform.service.ts          # 기본 플랫폼 서비스 (신규)
├── platform-service.interface.ts     # 통합 인터페이스 (업데이트)
├── platform-service-factory.ts       # 팩토리 패턴 (업데이트)
├── google-ads-oauth-platform.service.ts  # Google Ads (리팩토링)
├── facebook-platform.service.ts      # Meta Ads (리팩토링)
└── amazon-platform.service.ts        # Amazon Ads (리팩토링)

types/
└── platform-errors.types.ts          # 플랫폼 에러 타입 (신규)
```

### 리팩토링된 파일들

- 모든 플랫폼 서비스가 `BasePlatformService` 확장
- 일관된 메서드 시그니처 적용
- 통합된 에러 처리 로직

## 🔧 개발자 가이드

### 새로운 플랫폼 추가 방법

1. **플랫폼 서비스 생성**

```typescript
export class YourPlatformService extends BasePlatformService<YourApiClient> {
  platform: PlatformType = "your_platform";

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // 구현 로직
    }, "testConnection");
  }

  // 기타 필수 메서드 구현
}
```

2. **팩토리에 등록**

```typescript
this.services.set("your_platform", () => new YourPlatformService());
```

3. **환경 변수 추가**

```bash
YOUR_PLATFORM_CLIENT_ID=your_client_id
YOUR_PLATFORM_CLIENT_SECRET=your_client_secret
```

### 마이그레이션 가이드

#### 기존 코드 업데이트

```typescript
// 변경 전
const service = new GoogleAdsPlatformService();
service.setCredentials(credentials);

// 변경 후
const factory = getPlatformServiceFactory();
const service = await factory.createAndInitializeService("google", credentials);
```

#### 에러 처리 업데이트

```typescript
// 변경 전
try {
  await service.fetchCampaigns();
} catch (error) {
  console.error(error);
}

// 변경 후
try {
  await service.fetchCampaigns();
} catch (error) {
  if (error instanceof PlatformError) {
    log.error(`Platform error: ${error.userMessage}`, {
      platform: error.platform,
      code: error.code,
      retryable: error.retryable,
    });
  }
}
```

## 🧪 테스트 관련 변경

### 필수 테스트 항목

1. **연결 테스트**: 모든 플랫폼은 `testConnection` 구현 필수
2. **토큰 갱신**: `refreshToken` 메서드 테스트
3. **에러 처리**: 플랫폼별 에러 상황 테스트

### 테스트 실행

```bash
# 타입 체크
pnpm typecheck

# 코드 품질 검사
pnpm lint

# 포매팅
pnpm format
```

## 🚦 호환성 및 이전 버전 지원

### 환경 변수 호환성

- 기존 `META_CLIENT_*` 환경 변수는 deprecated
- 새로운 `META_APP_*` 환경 변수 사용 권장
- 점진적 마이그레이션 지원

### API 호환성

- 기존 플랫폼 서비스 인터페이스 유지
- 새로운 메서드는 선택적으로 구현 가능
- 레거시 코드와의 호환성 보장

## 🎯 향후 계획

### 단기 목표 (1-2개월)

- [ ] 남은 플랫폼들(Kakao, Naver, Coupang) 새 아키텍처로 마이그레이션
- [ ] 통합 테스트 스위트 구축
- [ ] 성능 모니터링 대시보드 구축

### 중기 목표 (3-6개월)

- [ ] 플랫폼별 고급 기능 추가 (키워드 관리, 오디언스 타겟팅 등)
- [ ] 실시간 데이터 동기화 구현
- [ ] API 율제한 최적화

이 아키텍처 업데이트를 통해 All-AD 플랫폼의 확장성, 유지보수성, 안정성이 크게 향상되었습니다.
