# Google Ads API 연동 개발 가이드

## 1. Google Ads API 핵심 개념 설명

### 계정 타입과 차이점

#### **일반 Google Ads 계정**

- **목적**: 실제 광고를 집행하는 표준 광고 계정
- **특징**:
  - 실제 사용자에게 광고 노출 가능
  - 결제 설정 및 예산 필요
  - 실제 비즈니스/광고주와 연결
  - 캠페인, 광고그룹, 광고, 키워드 운영 가능
- **사용 사례**:
  - 개별 비즈니스의 자체 광고 관리
  - 단순한 광고 요구사항을 가진 중소기업
  - 직접 광고주 계정

#### **MCC (My Client Center) 계정 / 관리자 계정**

- **목적**: 여러 Google Ads 계정을 중앙에서 관리하기 위한 관리 계정
- **특징**:
  - 직접 광고를 집행하거나 캠페인을 생성할 수 없음
  - 관리 및 행정 목적으로만 사용
  - 여러 관리 계정에 대한 단일 액세스 포인트 제공
  - 통합 청구 및 교차 계정 기능 활성화
  - 관리 계정 전체에 대한 통합 보고 제공
- **주요 기능**:
  - 여러 클라이언트 계정 또는 다른 관리자 계정 관리
  - 계층적 계정 구조 생성
  - 중앙 집중식 사용자 액세스 관리
  - 교차 계정 보고 및 최적화
- **사용 사례**:
  - 여러 클라이언트를 관리하는 광고 대행사
  - 여러 브랜드/부서를 가진 대기업
  - 마케팅 서비스 제공업체
  - 중앙 집중식 계정 감독이 필요한 조직

### 계층 구조: MCC > Account > Campaign > Ad Group > Ads/Keywords

```
MCC (관리자 계정)
├── Account (고객 계정)
│   ├── Campaign (캠페인)
│   │   ├── Ad Group (광고그룹)
│   │   │   ├── Ads (광고)
│   │   │   └── Keywords (키워드)
│   │   └── Ad Group
│   └── Campaign
└── Account
```

#### **각 계층의 역할과 기능:**

1. **MCC (관리자 계정) 레벨**

   - 최상위 관리 컨테이너
   - 여러 클라이언트 계정 관리
   - 통합 청구 옵션 제공
   - 교차 계정 사용자 관리 활성화

2. **Account (고객) 레벨**

   - 캠페인을 포함하는 개별 Google Ads 계정
   - 계정 전체 설정 포함 (시간대, 통화, 청구)
   - 전환 추적 및 잠재고객 데이터 저장

3. **Campaign 레벨**

   - 공유 설정을 가진 광고그룹의 전략적 그룹화
   - 예산 할당 및 지출 제어
   - 타겟팅 매개변수 정의 (위치, 언어, 네트워크)
   - 입찰 전략 및 캠페인 목표 설정

4. **Ad Group 레벨**

   - 밀접하게 관련된 광고와 키워드의 전술적 그룹화
   - 그룹 내 키워드의 기본 입찰가 설정
   - 광고 순환 및 최적화 설정 관리

5. **Ads/Keywords 레벨**
   - **Ads**: 사용자에게 표시되는 개별 광고
   - **Keywords**: 광고 표시를 트리거하는 검색어

### MCC 계정이 필요한 경우와 필요하지 않은 경우

#### **MCC 계정이 필요한 경우:**

- 여러 클라이언트의 광고를 관리하는 대행사나 컨설턴트
- 여러 브랜드, 부서 또는 자회사를 가진 대기업
- 계정 전체에 대한 통합 보고 및 관리가 필요한 조직
- 여러 Google Ads 계정을 관리하는 애플리케이션을 개발하는 개발자
- 10개 이상의 계정을 효율적으로 관리
- 공유 예산, 전환 액션 또는 제외 키워드 목록 활용
- 여러 계정에 대한 중앙 집중식 청구 관리

#### **MCC 계정이 필요하지 않은 경우:**

- 자체 광고만 관리하는 개별 기업
- 간단한 광고 요구사항을 가진 조직
- 직접적인 실무 계정 관리를 선호하는 비즈니스
- 5개 미만의 계정 관리
- 교차 계정 조정이 필요하지 않은 독립적인 운영

> **중요**: Google Ads API 개발자 토큰을 얻으려면 MCC 계정이 **필수**입니다.

## 2. Opteo google-ads-api 라이브러리 연동 방법

### 설치

```bash
npm install google-ads-api
```

### OAuth 2.0 인증 플로우

```javascript
const { google } = require("googleapis");
const { GoogleAdsApi } = require("google-ads-api");

class GoogleAdsOAuth {
  constructor(clientId, clientSecret, redirectUri) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  // Step 1: Generate authorization URL
  generateAuthUrl() {
    const scopes = ["https://www.googleapis.com/auth/adwords"];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent", // Ensures refresh token is always returned
    });
  }

  // Step 2: Exchange authorization code for tokens
  async getTokenFromCode(authorizationCode) {
    try {
      const { tokens } = await this.oauth2Client.getToken(authorizationCode);
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date,
      };
    } catch (error) {
      throw new Error(`OAuth token exchange failed: ${error.message}`);
    }
  }

  // Step 3: Refresh access token using refresh token
  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return {
        access_token: credentials.access_token,
        expires_in: credentials.expiry_date,
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }
}
```

### API 클라이언트 초기화

```javascript
const { GoogleAdsApi } = require("google-ads-api");

class GoogleAdsClient {
  constructor(config) {
    this.client = new GoogleAdsApi({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      developer_token: config.developerToken,
    });
  }

  // Create customer instance for specific account
  getCustomer(customerId, refreshToken, loginCustomerId = null) {
    const customerConfig = {
      customer_id: customerId,
      refresh_token: refreshToken,
    };

    // Add login customer ID for MCC accounts
    if (loginCustomerId) {
      customerConfig.login_customer_id = loginCustomerId;
    }

    return this.client.Customer(customerConfig);
  }
}

// Configuration
const config = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  developerToken: process.env.GOOGLE_DEVELOPER_TOKEN,
};

const adsClient = new GoogleAdsClient(config);
```

### 기본 API 호출 예제

#### 캠페인 목록 조회

```javascript
async function getCampaigns(customer) {
  try {
    const campaigns = await customer.report({
      entity: "campaign",
      attributes: [
        "campaign.id",
        "campaign.name",
        "campaign.status",
        "campaign.bidding_strategy_type",
        "campaign_budget.amount_micros",
      ],
      metrics: [
        "metrics.cost_micros",
        "metrics.clicks",
        "metrics.impressions",
        "metrics.conversions",
      ],
      constraints: {
        "campaign.status": enums.CampaignStatus.ENABLED,
      },
      limit: 50,
    });

    return campaigns;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
}
```

#### 계정 정보 조회

```javascript
async function getAccountInfo(customer) {
  try {
    const accountInfo = await customer.query(`
      SELECT 
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.status
      FROM customer
      WHERE customer.id = ${customer.credentials.customerId}
    `);

    return accountInfo[0];
  } catch (error) {
    console.error("Error fetching account info:", error);
    throw error;
  }
}
```

## 3. redirect_uri_mismatch (400 오류) 해결 방법

### 오류 발생 원인

`redirect_uri_mismatch` 오류는 OAuth 2.0 인증 과정에서 가장 흔한 오류 중 하나입니다. 주요 원인은:

1. **정확한 문자열 불일치**: 인증 요청의 redirect URI가 Google Cloud Console에 설정된 URI와 정확히 일치하지 않음
2. **프로토콜 차이**: `http` vs `https`
3. **도메인 차이**: `localhost` vs `127.0.0.1`
4. **포트 번호 차이**: `:8080` vs `:3000`
5. **경로 차이**: `/oauth/callback` vs `/oauth/callback/`
6. **대소문자 차이**: URI는 대소문자를 구분함

### Google Cloud Console 설정 방법

#### 1단계: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **APIs & Services** → **Credentials** 이동

#### 2단계: Google Ads API 활성화

1. **APIs & Services** → **Library** 이동
2. "Google Ads API" 검색
3. **Enable** 클릭

#### 3단계: OAuth 동의 화면 구성

1. **APIs & Services** → **OAuth consent screen** 이동
2. **External** 사용자 유형 선택
3. 필수 필드 입력:
   - App name: 애플리케이션 이름
   - User support email: 지원 이메일
   - Developer contact email: 연락처 이메일
4. 범위 추가: `https://www.googleapis.com/auth/adwords`

#### 4단계: OAuth 2.0 클라이언트 ID 생성

1. **APIs & Services** → **Credentials** 이동
2. **Create Credentials** → **OAuth client ID** 클릭
3. 애플리케이션 유형 선택:
   - **Web application**: 서버 사이드 앱용
   - **Desktop app**: 설치된 애플리케이션용

### 개발/프로덕션 환경별 리다이렉트 URI 설정

#### 개발 환경

```
http://localhost:8080/oauth2callback
http://127.0.0.1:8080/oauth2callback
https://localhost:8080/oauth2callback
```

#### 스테이징 환경

```
https://staging.yourapp.com/oauth2callback
https://dev.yourapp.com/auth/google/callback
```

#### 프로덕션 환경

```
https://yourapp.com/oauth2callback
https://www.yourapp.com/auth/google/callback
```

### 일반적인 문제 해결 방법

1. **URL 문자별 비교**

   ```javascript
   // 오류 메시지에서 redirect_uri 복사
   // Google Cloud Console 설정과 비교
   ```

2. **환경 변수 검증**

   ```javascript
   console.log("Redirect URI:", process.env.REDIRECT_URI);
   // 실제 사용되는 URI 확인
   ```

3. **여러 환경 URI 등록**

   ```
   # Google Cloud Console에 모든 변형 추가
   http://localhost:8080/callback
   http://127.0.0.1:8080/callback
   https://example.com/callback
   ```

4. **변경사항 반영 대기**
   - Google Cloud Console 변경사항은 5분에서 몇 시간까지 걸릴 수 있음

## 4. Next.js 15 App Router 환경에서의 구현

### 환경 변수 설정

```bash
# .env.local
GOOGLE_ADS_DEVELOPER_TOKEN=your_developer_token_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_ADS_CUSTOMER_ID=your_customer_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Server Actions 활용

Server Actions는 내부 앱 변경사항과 데이터 작업에 적합합니다:

```typescript
// actions/google-ads.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { GoogleAdsApi } from "google-ads-api";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const campaignSchema = z.object({
  name: z.string().min(1),
  budget: z.number().positive(),
  status: z.enum(["ENABLED", "PAUSED"]),
});

export async function createCampaign(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required" };
    }

    // Get OAuth tokens from Supabase
    const { data: tokenData } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single();

    if (!tokenData) {
      return { error: "Google OAuth token not found" };
    }

    // Validate form data
    const validatedFields = campaignSchema.safeParse({
      name: formData.get("name"),
      budget: Number(formData.get("budget")),
      status: formData.get("status"),
    });

    if (!validatedFields.success) {
      return {
        error: "Invalid form data",
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Initialize Google Ads API client
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      refresh_token: tokenData.refresh_token,
    });

    // Create campaign logic here...

    revalidatePath("/campaigns");
    return { success: true };
  } catch (error) {
    console.error("Campaign creation error:", error);
    return { error: "Failed to create campaign" };
  }
}
```

### 인증 토큰 관리 (Supabase 통합)

#### 데이터베이스 스키마

```sql
-- Create OAuth tokens table
CREATE TABLE oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tokens" ON oauth_tokens
  FOR SELECT USING (auth.uid() = user_id);
```

#### 토큰 자동 갱신 미들웨어

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session if expired
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

### Server Actions vs API Routes 선택 기준

#### Server Actions 사용 시점:

- 내부 앱 변경사항
- 폼 제출
- 앱 내 데이터 작업
- 타입 안전성이 중요한 작업

#### API Routes 사용 시점:

- OAuth 콜백
- 웹훅
- 외부 API 통합
- 특정 HTTP 메서드가 필요한 작업

## 5. 모듈화된 구현 방안

### 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   └── (dashboard)/       # Dashboard pages
├── core/                  # 핵심 비즈니스 로직
│   ├── domain/            # 도메인 엔티티
│   ├── usecases/          # 유스케이스
│   └── ports/             # 인터페이스
├── infrastructure/        # 외부 의존성
│   ├── api/               # Google Ads API 클라이언트
│   ├── repositories/      # 데이터 접근 구현
│   └── services/          # 외부 서비스 구현
└── presentation/          # UI 레이어
    ├── components/        # 재사용 가능한 컴포넌트
    └── hooks/             # 커스텀 React 훅
```

### 의존성 주입 패턴

```typescript
// container/container.ts
import { Container } from "inversify";
import { TYPES } from "./types";
import { GoogleAdsRepository } from "../infrastructure/repositories/GoogleAdsRepository";
import { CampaignUseCase } from "../core/usecases/CampaignUseCase";

const container = new Container();

// Repository bindings
container.bind(TYPES.GoogleAdsRepository).to(GoogleAdsRepository);

// Use case bindings
container.bind(TYPES.CampaignUseCase).to(CampaignUseCase);

export { container };
```

### Repository 패턴 구현

```typescript
// core/ports/IGoogleAdsRepository.ts
export interface IGoogleAdsRepository {
  getCampaigns(customerId: string): Promise<Campaign[]>;
  getCampaignById(
    customerId: string,
    campaignId: string,
  ): Promise<Campaign | null>;
  createCampaign(
    customerId: string,
    campaign: CreateCampaignRequest,
  ): Promise<Campaign>;
  updateCampaign(
    customerId: string,
    campaignId: string,
    updates: UpdateCampaignRequest,
  ): Promise<Campaign>;
}

// infrastructure/repositories/GoogleAdsRepository.ts
import { injectable, inject } from "inversify";
import { GoogleAdsApi } from "google-ads-api";
import { IGoogleAdsRepository } from "../../core/ports/IGoogleAdsRepository";

@injectable()
export class GoogleAdsRepository implements IGoogleAdsRepository {
  private client: GoogleAdsApi;

  constructor(@inject(TYPES.Logger) private logger: ILogger) {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });
  }

  async getCampaigns(customerId: string): Promise<Campaign[]> {
    // Implementation...
  }
}
```

### 타입 정의 및 관리

```typescript
// shared/types/google-ads.ts
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channelType: AdvertisingChannelType;
  budget?: Budget;
  metrics?: CampaignMetrics;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

export enum CampaignStatus {
  ENABLED = "ENABLED",
  PAUSED = "PAUSED",
  REMOVED = "REMOVED",
}
```

### 재사용 가능한 컴포넌트 구조

```typescript
// presentation/components/campaign/CampaignDashboard.tsx
'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CampaignTable } from './CampaignTable';
import { useCampaignDashboard } from '../../hooks/useCampaignDashboard';

interface CampaignDashboardProps {
  customerId: string;
  dateRange: DateRange;
}

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({
  customerId,
  dateRange,
}) => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useCampaignDashboard(customerId, dateRange);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-6">
      <CampaignTable campaigns={dashboardData.campaigns} />
    </div>
  );
};
```

## 6. 캠페인 ON/OFF 기능 구현 예제

### Server Action 구현

```typescript
// actions/campaign-toggle.ts
"use server";

import { GoogleAdsApi, enums } from "google-ads-api";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleCampaignStatus(
  campaignId: string,
  currentStatus: string,
) {
  try {
    // 1. 사용자 인증 확인
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Authentication required" };
    }

    // 2. OAuth 토큰 가져오기
    const { data: tokenData } = await supabase
      .from("oauth_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single();

    if (!tokenData) {
      return { error: "Google OAuth token not found" };
    }

    // 3. Google Ads API 클라이언트 초기화
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    });

    const customer = client.Customer({
      customer_id: process.env.GOOGLE_ADS_CUSTOMER_ID!,
      refresh_token: tokenData.refresh_token,
    });

    // 4. 새로운 상태 결정 (토글)
    const newStatus =
      currentStatus === "ENABLED"
        ? enums.CampaignStatus.PAUSED
        : enums.CampaignStatus.ENABLED;

    // 5. 캠페인 상태 업데이트
    const campaignResourceName = `customers/${process.env.GOOGLE_ADS_CUSTOMER_ID}/campaigns/${campaignId}`;

    await customer.mutateResources([
      {
        entity: "campaign",
        operation: "update",
        resource_name: campaignResourceName,
        resource: {
          resource_name: campaignResourceName,
          status: newStatus,
        },
        update_mask: ["status"],
      },
    ]);

    // 6. 캐시 무효화
    revalidatePath("/campaigns");

    return {
      success: true,
      newStatus:
        newStatus === enums.CampaignStatus.ENABLED ? "ENABLED" : "PAUSED",
    };
  } catch (error) {
    console.error("Failed to toggle campaign status:", error);
    return { error: "Failed to update campaign status" };
  }
}
```

### UI 컴포넌트 구현

```typescript
// components/campaign/CampaignToggle.tsx
'use client'

import React, { useState } from 'react';
import { toggleCampaignStatus } from '@/actions/campaign-toggle';

interface CampaignToggleProps {
  campaignId: string;
  initialStatus: 'ENABLED' | 'PAUSED';
  campaignName: string;
}

export function CampaignToggle({
  campaignId,
  initialStatus,
  campaignName
}: CampaignToggleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);

    try {
      const result = await toggleCampaignStatus(campaignId, status);

      if (result.success && result.newStatus) {
        setStatus(result.newStatus as 'ENABLED' | 'PAUSED');
        // Show success toast
        toast.success(`Campaign ${result.newStatus === 'ENABLED' ? 'enabled' : 'paused'}`);
      } else if (result.error) {
        // Show error toast
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">
        {campaignName}
      </span>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          ${status === 'ENABLED' ? 'bg-green-600' : 'bg-gray-300'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          transition-colors duration-200 ease-in-out
        `}
        aria-label={`Toggle campaign ${campaignName}`}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${status === 'ENABLED' ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      <span className="text-xs text-gray-500">
        {status === 'ENABLED' ? 'Active' : 'Paused'}
      </span>
    </div>
  );
}
```

### 캠페인 목록 페이지 통합

```typescript
// app/(dashboard)/campaigns/page.tsx
import { getCampaigns } from '@/actions/google-ads';
import { CampaignToggle } from '@/components/campaign/CampaignToggle';

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Campaign Management</h1>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {campaign.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    campaign.status === 'ENABLED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CampaignToggle
                    campaignId={campaign.id}
                    initialStatus={campaign.status}
                    campaignName={campaign.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 에러 처리 및 로깅

```typescript
// utils/error-handler.ts
export class GoogleAdsError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "GoogleAdsError";
  }
}

export function handleGoogleAdsError(error: any): GoogleAdsError {
  if (error.errors && error.errors.length > 0) {
    const firstError = error.errors[0];
    return new GoogleAdsError(
      firstError.message,
      firstError.error_code,
      firstError,
    );
  }

  return new GoogleAdsError("An unknown error occurred", "UNKNOWN", error);
}
```

## 마무리

이 가이드는 Google Ads API를 Next.js 15 App Router 환경에서 구현하는 완전한 방법을 제공합니다. 주요 포인트:

1. **MCC 계정 필요성**: API 개발자 토큰을 위해 필수
2. **Opteo 라이브러리**: 간편한 Node.js 통합 제공
3. **OAuth 오류 해결**: 정확한 redirect URI 매칭이 핵심
4. **Next.js 15 통합**: Server Actions와 Supabase를 활용한 안전한 구현
5. **모듈화 아키텍처**: 확장 가능하고 유지보수가 쉬운 구조
6. **실제 구현 예제**: 캠페인 ON/OFF 토글 기능

이 가이드를 따라 구현하면 확장 가능하고 유지보수가 쉬운 Google Ads API 통합을 완성할 수 있습니다.
