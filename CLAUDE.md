# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 multi-tenant advertising platform that integrates multiple ad platforms (Facebook, Google, Kakao, Naver, Coupang) into a unified dashboard. The architecture follows server-first patterns with Supabase as the backend.

[너가 작업해야할 경로, 프로젝트 경로 MCP 활용]
/Users/2309-n0015/Code/Project/all-ad

- 틱톡, 구글, 메타, 아마존등 통합에 필요한 문서들은 docs 에 위치하고 있어, API 연동 관련된 문서들은 반드시 참조해줘
- 플랫폼 별 여러 계정을 연동 할 수 있어야해
- 작업전 STRUCTURE.md 파일, 프로젝트지식(프로젝트 정책 및 유저 워크플로우)을 확인하여 중복 코드 방지 및 기존 코드를 활용해줘, 작업후 구조 변경시 STRUCTURE.md 도 업데이트 되어야해
- 작업 후 pnpm format, pnpm lint, pnpm build 를 통해 문제 없음을 검증하도록 해줘
- 작업 전후로 playwright 테스트 코드를 작성, 수정, 삭제등 최신화 해야해 ( pnpm exec playwright test
  Runs the end-to-end tests.
  pnpm exec playwright test --ui
  Starts the interactive UI mode.
  pnpm exec playwright test --project=chromium
  Runs the tests only on Desktop Chrome.
  pnpm exec playwright test example
  Runs the tests in a specific file.
  pnpm exec playwright test --debug
  Runs the tests in debug mode.
  pnpm exec playwright codegen
  Auto generate tests with Codegen.
  We suggest that you begin by typing:
  pnpm exec playwright test
  )
- 이미 이메일 기반 로그인/회원가입 시스템이 구현(Auth)되어있음
- 모든 재사용 가능한 코드들은 components 또는 utils 경로에 저장하고 활용해줘
- 기존 코드를 먼저 숙지하고 작업해줘 login 이 있는데 signin 경로에 또 생성하는 등 하지 말아줘
- icon 은 모두 react-icons 를 사용해줘
- log는 utils/logger.ts 를 이용하면돼 console.log 말고
- import는 반드시 `import log from "@/utils/logger"` 형식으로 통일해줘

[기술 스택]
Next.js(15 App router) , Zustand, Hero UI
차트: Apache ECharts 활용
배포 및 호스팅: Vercel
기타 인프라 서비스: Supabase with PostgreSQL

[기술적 요구사항]

- 서버 컴포넌트, Server Actions and Mutations 등 최적화 해줘
- 여러 광고 대행사, 광고사, 공급사 는 각기 다른 연동방식(SDK, Open API, DB to DB 등등) 을 가지고 있어 유연한 연동 방식을 제공할 수 있어야해
- 모듈화, 재사용성을 고려하여 코드 양이 많아지지 않도록 기존 코드를 재사용하고, 유지보수 성을 극대화해줘
- dependency injection, inversion 등 여러 디자인 패턴을 반영해줘
- UI 컴포넌트는 무조건 Hero UI 를 사용하고 기본 HTML, tailwind 는 UI 요소는 최소한으로 사용해줘 일관된 UI를 제공해야해
- 프로젝트의 모든 테이블은 클로드 문서의 Infinite Scroll
- Table 를 참고하여 모두 infinite scroll 와 같이 작성되어야해
- 오래 생각하고 깊게 고민하여 신중하게 구조를 설계하고 작성해줘
- 필요 없는 코드는 다 제거해 중복은 최소화 해줘

[type, typescript]
모든 타입들은 types 폴더 내부에 d.ts 형태로 관리 되어야해
데이터 베이스 타입들은 supabase gen types typescript --linked > types/supabase.types.ts(readonly file) 로 관리되고 있어

[store 사용]

- 모든 store는 `/stores` 폴더에 위치해야해 (store 폴더 아님)
- 다음와 같이 slice - store 패턴을 사용하여 여러 슬라이스 들을 재사용 할 수 있어야해

export const createLogDataSlice: StateCreator<
LogDataSlice,
[],
[],
LogDataSlice

> = (set) => ({})

export const useLogDataStore = create<LogDataState>()(
devtools(
persist(
(set, get, api) => ({
// 슬라이스 연결
...createLoadingSlice(set, get, api),
...createPaginationSlice(set, get, api),
...createLogFilterSlice(set, get, api),
...createLogDataSlice(set, get, api),

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code (with auto-fix)
npm run lint

# Format code
npm run format

# Generate TypeScript types from Supabase schema
npm run gen:type:supabase
```

## Architecture Patterns

### Server-First with Clean Architecture

- **Server Components by Default**: Data fetching happens on the server
- **Server Actions**: All mutations go through server actions in `actions.ts` files
- **Client Components**: Only for interactivity (forms, modals, real-time updates)
- **Data Flow**: Server → DataProvider → Client Components → Zustand Store

### Key Architectural Decisions

1. **Platform Abstraction**: Factory pattern for multi-platform support

   - Interface: `/services/platforms/platform-service.interface.ts`
   - Factory: `/services/platforms/platform-service-factory.ts`
   - Each platform implements the common interface

2. **Authentication & Authorization**:

   - Supabase Auth with RLS (Row Level Security)
   - Team-based multi-tenancy with roles: master, team_mate, viewer
   - Middleware handles session refresh and route protection

3. **State Management**:
   - Zustand stores for client-side state
   - Server state via Server Components and Server Actions
   - DataProvider pattern for initial hydration

## Database Schema

Core tables with Row Level Security:

- `profiles`: User profiles linked to auth.users
- `teams`: Organizations with automatic creation on signup
- `team_members`: Membership with role-based permissions
- `platform_credentials`: Encrypted API credentials per platform
- `campaigns`: Unified campaign data from all platforms

Migrations are in `/supabase/migrations/` - sequential SQL files with RLS policies.

## Common Development Tasks

### Adding a New Platform

1. Create service in `/services/platforms/{platform}-platform.service.ts`
2. Implement `PlatformService` interface
3. Register in `PlatformServiceFactory`
4. Add platform type to enums
5. Create UI components if needed

### Working with Server Actions

Server actions follow this pattern:

```typescript
// In app/.../actions.ts
export async function actionName(data: FormData) {
  const supabase = await createClient();
  // Check permissions
  // Perform operation
  // Revalidate paths
  return { success: true } or { error: "message" }
}
```

### Database Changes

1. Create migration in `/supabase/migrations/`
2. Include RLS policies in the migration
3. Run migration locally
4. Regenerate types: `npm run gen:type:supabase`

## Security Considerations

- All platform credentials are encrypted in the database
- RLS policies enforce team isolation
- Server actions include permission checks
- Environment variables for sensitive config
- No client-side API calls to external platforms

---

# Made by Seongpil

# Advertising API integration guide for Korean platforms

Korean advertising platforms present unique integration challenges compared to global platforms, with varying levels of API maturity and documentation quality. Based on comprehensive research, here's a detailed technical analysis of Kakao, Naver, and Coupang advertising APIs, along with practical implementation strategies.

## Kakao Moment API offers the most comprehensive capabilities

The Kakao Moment API stands out as the most mature advertising API among Korean platforms, featuring comprehensive OAuth2 authentication, full campaign management capabilities, and detailed reporting APIs. However, **access requires official permission from Kakao** and is limited to approved agencies and advertisers.

### Authentication implementation

Kakao uses a Business Authentication flow with OAuth2:

```javascript
// Authorization request
GET https://kauth.kakao.com/oauth/authorize?
response_type=code&
client_id=${REST_API_KEY}&
redirect_uri=${REDIRECT_URI}&
scope=${REQUIRED_SCOPES}

// Token exchange
POST https://kauth.kakao.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=${REST_API_KEY}&
redirect_uri=${REDIRECT_URI}&
code=${AUTHORIZATION_CODE}
```

**Token lifecycle**: Access tokens expire after 12 hours, refresh tokens after 60 days. All API requests require both the Bearer token and adAccountId in headers.

### Campaign management capabilities

The API base URL is `https://apis.moment.kakao.com/openapi/v4/` and supports:

- **Campaign operations**: Create, update, pause/resume with support for Bizboard, Display, Video, and Kakao Talk Channel campaign types
- **Ad group management**: Budget control, bid management, scheduling
- **Creative management**: Full CRUD operations for ad creatives

### Rate limits and performance considerations

Kakao enforces strict rate limits:

- **Report APIs**: 5-second intervals per ad account
- **Customer file operations**: 5-second intervals
- **General API limit**: Returns error code -10 when exceeded
- **Report date ranges**: Maximum 31 days per request
- **Batch operations**: Not natively supported - implement client-side batching

### Reporting and analytics

The API provides comprehensive metrics across multiple dimensions:

```javascript
GET / campaigns / report;
// Available metric groups: BASIC, VIDEO, PIXEL_CONVERSION, SDK_CONVERSION
// Dimensions: AGE, GENDER, LOCATION, DEVICE_TYPE, PLACEMENT
// Real-time data: datePreset=TODAY (finalized at 8:00 AM KST next day)
```

## Naver Search Ads API requires custom development

Naver's API uses a simpler authentication model but **lacks official SDKs**, requiring significant custom development effort. The API is well-suited for keyword-based search advertising with programmatic bid management.

### Authentication setup

Unlike OAuth2, Naver uses direct key authentication:

1. Register at http://searchad.naver.com
2. Access http://manage.searchad.naver.com
3. Navigate to Tools > API Manager to create API License
4. Include credentials in HTTP headers for all requests

### Technical implementation approach

With no official SDK, developers should leverage the official GitHub samples:

```python
# Environment setup
NAVER_API_KEY="YOUR_ACCESS_LICENSE"
NAVER_API_SECRET="YOUR_SECRET_KEY"
NAVER_API_CLIENT_ID="YOUR_CUSTOMER_ID"

# Custom wrapper recommended for API calls
def naver_api_request(endpoint, method='GET', data=None):
    headers = {
        'X-API-KEY': NAVER_API_KEY,
        'X-Customer': NAVER_API_CLIENT_ID,
        'X-Signature': generate_signature(endpoint, method)
    }
    # Implementation details...
```

### Key limitations

- **No published rate limits** - implement conservative throttling
- **Keyword limits**: Brand Search ads capped at 30 keywords
- **Minimum bid**: 70 Won (~$0.054 USD)
- **Documentation gaps**: Technical details often sparse

### Bulk operations

While limited compared to global platforms, Naver supports:

- CSV template uploads for campaign creation
- Batch keyword management
- Bulk bid adjustments
- Performance data extraction via API

## Coupang provides no public advertising API

Coupang's advertising ecosystem is **entirely manual** with no public API for campaign management, reporting, or optimization. This represents a significant limitation for programmatic advertising.

### Current integration reality

- **Manual only**: All advertising managed through Coupang Ads Center web interface
- **No bulk tools**: No CSV uploads or batch operations
- **No data export**: Performance metrics trapped in web interface
- **Seller API exists**: Comprehensive APIs for product/inventory management, but not advertising

### Available workarounds

For organizations requiring Coupang advertising data:

1. **Manual workflows**: Standardized naming conventions and regular manual reviews
2. **Screenshot automation**: Tools like Selenium for basic reporting (compliance risk)
3. **Team training**: Invest in platform expertise for manual optimization
4. **Consultation services**: Leverage Coupang's free advertiser support

### Strategic considerations

Given the limitations:

- Budget for manual campaign management resources
- Focus on AI Smart Ads for automation within the platform
- Consider Coupang's growing market share despite API limitations
- Monitor for future API announcements (none currently planned)

## Multi-platform integration architecture

Successfully integrating these disparate platforms requires a sophisticated architecture that handles varying API maturity levels, authentication methods, and data formats.

### Recommended system architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Gateway   │────▶│ Transformation   │────▶│ Data Warehouse  │
│ (Rate Limiting) │     │     Layer        │     │  (Unified Schema)│
└────────┬────────┘     └──────────────────┘     └─────────┬───────┘
         │                                                   │
         ▼                                                   ▼
┌─────────────────┐                               ┌─────────────────┐
│Platform Adapters│                               │Reporting Dashboard│
│-Kakao           │                               │(Real-time metrics)│
│-Naver           │                               └─────────────────┘
│-Coupang(manual) │
└─────────────────┘
```

### Critical implementation patterns

**Unified error handling with platform-specific logic**:

```javascript
class PlatformAPIClient {
  async makeRequest(platform, endpoint, options) {
    const retryConfig = {
      kakao: { maxRetries: 3, backoff: 5000 }, // 5-second minimum
      naver: { maxRetries: 5, backoff: 1000 }, // Conservative
      coupang: { maxRetries: 0 }, // N/A - manual platform
    };

    try {
      return await this.executeWithRetry(
        platform,
        endpoint,
        options,
        retryConfig[platform],
      );
    } catch (error) {
      this.handlePlatformSpecificError(platform, error);
    }
  }
}
```

**Data normalization strategy**:

```javascript
const metricMappings = {
  kakao: {
    impressions: "impCnt",
    clicks: "clickCnt",
    cost: "salesAmt",
  },
  naver: {
    impressions: "impressions",
    clicks: "clicks",
    cost: "cost",
  },
};

function normalizeMetrics(platform, rawData) {
  const mapping = metricMappings[platform];
  return Object.keys(mapping).reduce((normalized, key) => {
    normalized[key] = rawData[mapping[key]] || 0;
    return normalized;
  }, {});
}
```

### Platform-specific synchronization strategies

**Kakao**: Real-time for status changes, batch for reporting (respecting 5-second intervals)
**Naver**: Incremental sync with conservative rate limiting
**Coupang**: Scheduled manual data entry with validation workflows

### Monitoring and alerting requirements

Essential metrics to track:

- API success rates by platform (target: >95%)
- Data synchronization lag (threshold: <30 minutes)
- Rate limit buffer utilization (alert at 80%)
- Manual process completion for Coupang (daily checklist)

## Implementation roadmap and recommendations

### Phase 1: Foundation (Weeks 1-4)

1. Obtain Kakao Moment API access approval
2. Set up Naver API credentials and test environment
3. Design manual workflows for Coupang
4. Build unified authentication service

### Phase 2: Core development (Weeks 5-8)

1. Implement Kakao integration with full error handling
2. Build custom Naver SDK wrapper
3. Create data normalization layer
4. Establish monitoring infrastructure

### Phase 3: Optimization (Weeks 9-12)

1. Add intelligent rate limit management
2. Implement cross-platform reporting
3. Build Coupang manual process automation
4. Performance tune data pipelines

### Key technical decisions

**Language choice**: Python or Node.js recommended for:

- Strong async support for API calls
- Robust error handling capabilities
- Korean language processing libraries
- Active community support

**Infrastructure requirements**:

- API gateway with circuit breakers
- Message queue for reliable processing
- Time-series database for metrics
- Workflow orchestration tool (Apache Airflow recommended)

### Cost and resource planning

Estimated development effort:

- **Kakao integration**: 2-3 developer weeks
- **Naver integration**: 3-4 developer weeks (no SDK)
- **Coupang workflows**: 1-2 developer weeks
- **Platform orchestration**: 2-3 developer weeks
- **Testing and optimization**: 2-3 developer weeks

Ongoing operational requirements:

- 1 FTE for Coupang manual operations
- 0.5 FTE for system monitoring and maintenance
- Quarterly platform update reviews

The Korean advertising API landscape presents unique challenges compared to global platforms, with Kakao offering the most comprehensive programmatic capabilities, Naver requiring significant custom development, and Coupang lacking any API altogether. Success requires a hybrid approach combining automated integrations where available with well-designed manual processes, all unified through a robust data architecture that can handle the disparate nature of these platforms.

---

## 1. 인증 방식 설계

Google Ads API 인증은 **OAuth 2.0 Service Account** 방식을 추천합니다. 이 방식의 장점은 사용자 개입 없이 백그라운드에서 자동으로 토큰을 갱신할 수 있고, 대규모 계정 관리에 적합하다는 것입니다.

```typescript
// types/google-ads.types.ts
export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  loginCustomerId?: string; // MCC 계정 ID
}

export interface GoogleAdsAccount {
  id: string;
  name: string;
  customerId: string;
  credentials: GoogleAdsCredentials;
  isManager: boolean;
  parentId?: string;
}
```

## 2. 모듈화된 서비스 아키텍처

각 기능별로 독립적인 서비스를 구성하여 의존성 주입과 확장성을 고려한 설계입니다.

```typescript
// services/google-ads/core/google-ads-client.ts
import { GoogleAdsApi } from "google-ads-api";
import { GoogleAdsCredentials } from "@/types/google-ads.types";

export class GoogleAdsClient {
  private client: GoogleAdsApi;

  constructor(private credentials: GoogleAdsCredentials) {
    this.client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken,
    });
  }

  async getAuthenticatedClient(customerId: string) {
    const customer = this.client.Customer({
      customer_id: customerId,
      refresh_token: this.credentials.refreshToken,
      login_customer_id: this.credentials.loginCustomerId,
    });

    return customer;
  }
}
```

## 3. 캠페인 제어 서비스

캠페인 ON/OFF 기능을 최우선으로 구현합니다.

```typescript
// services/google-ads/campaign/campaign-control.service.ts
import { GoogleAdsClient } from "../core/google-ads-client";
import { logger } from "@/utils/logger";

export interface CampaignStatusUpdate {
  campaignId: string;
  status: "ENABLED" | "PAUSED" | "REMOVED";
}

export class CampaignControlService {
  constructor(private googleAdsClient: GoogleAdsClient) {}

  async updateCampaignStatus(
    customerId: string,
    updates: CampaignStatusUpdate[],
  ) {
    const customer =
      await this.googleAdsClient.getAuthenticatedClient(customerId);

    const operations = updates.map((update) => ({
      entity: "campaign",
      operation: "update",
      resource: {
        resource_name: `customers/${customerId}/campaigns/${update.campaignId}`,
        status: update.status,
      },
      update_mask: {
        paths: ["status"],
      },
    }));

    try {
      const response = await customer.mutateResources(operations);
      logger.info("캠페인 상태 업데이트 성공", {
        customerId,
        count: updates.length,
      });
      return response;
    } catch (error) {
      logger.error("캠페인 상태 업데이트 실패", { customerId, error });
      throw error;
    }
  }

  async getCampaigns(customerId: string, includeRemoved = false) {
    const customer =
      await this.googleAdsClient.getAuthenticatedClient(customerId);

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ${!includeRemoved ? 'AND campaign.status != "REMOVED"' : ""}
      ORDER BY campaign.id
    `;

    const response = await customer.query(query);
    return response;
  }
}
```

## 4. 라벨 관리 서비스

라벨을 통한 캠페인 분류 및 관리 기능을 구현합니다.

```typescript
// services/google-ads/label/label-management.service.ts
export class LabelManagementService {
  constructor(private googleAdsClient: GoogleAdsClient) {}

  async createLabel(
    customerId: string,
    labelData: {
      name: string;
      description?: string;
      backgroundColor?: string;
    },
  ) {
    const customer =
      await this.googleAdsClient.getAuthenticatedClient(customerId);

    const labelOperation = {
      entity: "label",
      operation: "create",
      resource: {
        name: labelData.name,
        description: labelData.description,
        background_color: labelData.backgroundColor || "#0000FF",
      },
    };

    const response = await customer.mutateResources([labelOperation]);
    return response;
  }

  async assignLabelToCampaigns(
    customerId: string,
    labelId: string,
    campaignIds: string[],
  ) {
    const customer =
      await this.googleAdsClient.getAuthenticatedClient(customerId);

    const operations = campaignIds.map((campaignId) => ({
      entity: "campaign_label",
      operation: "create",
      resource: {
        campaign: `customers/${customerId}/campaigns/${campaignId}`,
        label: `customers/${customerId}/labels/${labelId}`,
      },
    }));

    const response = await customer.mutateResources(operations);
    return response;
  }

  async getCampaignsByLabel(customerId: string, labelId: string) {
    const customer =
      await this.googleAdsClient.getAuthenticatedClient(customerId);

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        label.id,
        label.name
      FROM campaign_label
      WHERE label.id = ${labelId}
    `;

    const response = await customer.query(query);
    return response;
  }
}
```

## 5. 데이터 동기화 전략

대규모 계정 처리를 위한 **증분 동기화(Incremental Sync)** 전략을 추천합니다.

```typescript
// services/google-ads/sync/sync-strategy.service.ts
import { Queue } from "bull";
import { createClient } from "@/utils/supabase/server";

export class GoogleAdsSyncService {
  private syncQueue: Queue;

  constructor() {
    this.syncQueue = new Queue("google-ads-sync", {
      redis: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.setupQueueProcessors();
  }

  // 계정별 동기화 작업 스케줄링
  async scheduleSyncForAccount(
    accountId: string,
    syncType: "FULL" | "INCREMENTAL",
  ) {
    await this.syncQueue.add(
      "sync-account",
      {
        accountId,
        syncType,
        timestamp: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );
  }

  private setupQueueProcessors() {
    this.syncQueue.process("sync-account", async (job) => {
      const { accountId, syncType } = job.data;

      if (syncType === "INCREMENTAL") {
        await this.performIncrementalSync(accountId);
      } else {
        await this.performFullSync(accountId);
      }
    });
  }

  private async performIncrementalSync(accountId: string) {
    const supabase = createClient();

    // 마지막 동기화 시점 조회
    const { data: lastSync } = await supabase
      .from("sync_logs")
      .select("last_sync_at")
      .eq("account_id", accountId)
      .single();

    const lastSyncDate =
      lastSync?.last_sync_at ||
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 변경된 데이터만 조회
    const modifiedCampaigns = await this.getModifiedCampaigns(
      accountId,
      lastSyncDate,
    );

    // 데이터베이스 업데이트
    await this.updateCampaignData(accountId, modifiedCampaigns);

    // 동기화 로그 업데이트
    await supabase.from("sync_logs").upsert({
      account_id: accountId,
      last_sync_at: new Date().toISOString(),
      sync_type: "INCREMENTAL",
      records_processed: modifiedCampaigns.length,
    });
  }

  private async getModifiedCampaigns(accountId: string, since: string) {
    // Change History API를 사용하여 변경 내역 조회
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        segments.date
      FROM campaign
      WHERE segments.date >= '${since.split("T")[0]}'
      ORDER BY segments.date DESC
    `;

    // 실제 구현 시 GoogleAdsClient를 통해 쿼리 실행
    return [];
  }
}
```

### 6. Vercel JSON

Configuring projects with vercel.json
The vercel.json configuration file lets you configure, and override the default behavior of Vercel from within your project. This includes settings for:

schema autocomplete
buildCommand
cleanUrls
crons
devCommand
framework
functions
headers
ignoreCommand
images
installCommand
outputDirectory
public
redirects
regions
functionFailoverRegion
rewrites
trailingSlash
To get started, create a vercel.json file in your project's root directory.

Schema autocomplete
To add autocompletion, type checking, and schema validation to your vercel.json file, add the following to the top of your file:

{
"$schema": "https://openapi.vercel.sh/vercel.json"
}
buildCommand
Type: string | null

The buildCommand property can be used to override the Build Command in the Project Settings dashboard, and the build script from the package.json file for a given deployment. For more information on the default behavior of the Build Command, visit the Configure a Build - Build Command section.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"buildCommand": "next build"
}
This value overrides the Build Command in Project Settings.

cleanUrls
Type: Boolean.

Default Value: false.

When set to true, all HTML files and Serverless Functions will have their extension removed. When visiting a path that ends with the extension, a 308 response will redirect the client to the extensionless path.

For example, a static file named about.html will be served when visiting the /about path. Visiting /about.html will redirect to /about.

Similarly, a Serverless Function named api/user.go will be served when visiting /api/user. Visiting /api/user.go will redirect to /api/user.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"cleanUrls": true
}
If you are using Next.js and running vercel dev, you will get a 404 error when visiting a route configured with cleanUrls locally. It does however work fine when deployed to Vercel. In the example above, visiting /about locally will give you a 404 with vercel dev but /about will render correctly on Vercel.

crons
Used to configure cron jobs for the production deployment of a project.

Type: Array of cron Object.

Limits:

A maximum of string length of 512 for the path value.
A maximum of string length of 256 for the schedule value.
Cron object definition
path - Required - The path to invoke when the cron job is triggered. Must start with /.
schedule - Required - The cron schedule expression to use for the cron job.
vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"crons": [
{
"path": "/api/every-minute",
"schedule": "* * * * *"
},
{
"path": "/api/every-hour",
"schedule": "0 * * * *"
},
{
"path": "/api/every-day",
"schedule": "0 0 * * *"
}
]
}
devCommand
This value overrides the Development Command in Project Settings.

Type: string | null

The devCommand property can be used to override the Development Command in the Project Settings dashboard. For more information on the default behavior of the Development Command, visit the Configure a Build - Development Command section.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"devCommand": "next dev"
}
framework
This value overrides the Framework in Project Settings.

Type: string | null

Available framework slugs:

nextjs
nuxtjs
svelte
create-react-app
gatsby
remix
react-router
solidstart
sveltekit
blitzjs
astro
hexo
eleventy
docusaurus-2
docusaurus
preact
solidstart-1
dojo
ember
vue
scully
ionic-angular
angular
polymer
sveltekit-1
ionic-react
gridsome
umijs
sapper
saber
stencil
redwoodjs
hugo
jekyll
brunch
middleman
zola
hydrogen
vite
vitepress
vuepress
parcel
fasthtml
sanity-v3
sanity
storybook
nitro
The framework property can be used to override the Framework Preset in the Project Settings dashboard. The value must be a valid framework slug. For more information on the default behavior of the Framework Preset, visit the Configure a Build - Framework Preset section.

To select "Other" as the Framework Preset, use null.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"framework": "nextjs"
}
functions
Type: Object of key String and value Object.

Key definition
A glob pattern that matches the paths of the Serverless Functions you would like to customize:

api/_.js (matches one level e.g. api/hello.js but not api/hello/world.js)
api/\*\*/_.ts (matches all levels api/hello.ts and api/hello/world.ts)
src/pages/\*_/_ (matches all functions from src/pages)
api/test.js
Value definition
runtime (optional): The npm package name of a Runtime, including its version.
memory (optional): An integer defining the memory in MB for your Serverless Function (between 128 and 3009).
maxDuration (optional): An integer defining how long your Serverless Function should be allowed to run on every request in seconds (between 1 and the maximum limit of your plan, as mentioned below).
includeFiles (optional): A glob pattern to match files that should be included in your Serverless Function. If you’re using a Community Runtime, the behavior might vary. Please consult its documentation for more details. (Not supported in Next.js, instead use outputFileTracingIncludes in next.config.js )
excludeFiles (optional): A glob pattern to match files that should be excluded from your Serverless Function. If you’re using a Community Runtime, the behavior might vary. Please consult its documentation for more details. (Not supported in Next.js, instead use outputFileTracingIncludes in next.config.js )
Description
By default, no configuration is needed to deploy Serverless Functions to Vercel.

For all officially supported runtimes, the only requirement is to create an api directory at the root of your project directory, placing your Serverless Functions inside.

The functions property cannot be used in combination with builds. Since the latter is a legacy configuration property, we recommend dropping it in favor of the new one.

Because Incremental Static Regeneration (ISR) uses Serverless Functions, the same configurations apply. The ISR route can be defined using a glob pattern, and accepts the same properties as when using Serverless Functions.

When deployed, each Serverless Function receives the following properties:

Memory: 1024 MB (1 GB) - (Optional)
Maximum Duration: 10s default - 60s (Hobby), 15s default - 300s (Pro), or 15s default - 900s (Enterprise). This can be configured up to the respective plan limit) - (Optional)
To configure them, you can add the functions property.

functions property with Serverless Functions
vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"functions": {
"api/test.js": {
"memory": 3009,
"maxDuration": 30
},
"api/\*.js": {
"memory": 3009,
"maxDuration": 30
}
}
}
functions property with ISR
vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"functions": {
"pages/blog/[hello].tsx": {
"memory": 1024
},
"src/pages/isr/\*_/_": {
"maxDuration": 10
}
}
}
Using unsupported runtimes
In order to use a runtime that is not officially supported, you can add a runtime property to the definition:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"functions": {
"api/test.php": {
"runtime": "vercel-php@0.5.2"
}
}
}
In the example above, the api/test.php Serverless Function does not use one of the officially supported runtimes. In turn, a runtime property was added in order to invoke the vercel-php community runtime.

For more information on Runtimes, see the Runtimes documentation:

headers
Type: Array of header Object.

Valid values: a list of header definitions.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"headers": [
{
"source": "/service-worker.js",
"headers": [
{
"key": "Cache-Control",
"value": "public, max-age=0, must-revalidate"
}
]
},
{
"source": "/(._)",
"headers": [
{
"key": "X-Content-Type-Options",
"value": "nosniff"
},
{
"key": "X-Frame-Options",
"value": "DENY"
},
{
"key": "X-XSS-Protection",
"value": "1; mode=block"
}
]
},
{
"source": "/:path_",
"has": [
{
"type": "query",
"key": "authorized"
}
],
"headers": [
{
"key": "x-authorized",
"value": "true"
}
]
}
]
}
This example configures custom response headers for static files, Serverless Functions, and a wildcard that matches all routes.

Header object definition
Property Description
source A pattern that matches each incoming pathname (excluding querystring).
headers A non-empty array of key/value pairs representing each response header.
has An optional array of has objects with the type, key and value properties. Used for conditional path matching based on the presence of specified properties.
missing An optional array of missing objects with the type, key and value properties. Used for conditional path matching based on the absence of specified properties.
Header has or missing object definition
Property Type Description
type String Must be either header, cookie, host, or query. The type property only applies to request headers sent by clients, not response headers sent by your functions or backends.
key String The key from the selected type to match against.
value String or not defined The value to check for, if undefined any value will match. A regex like string can be used to capture a specific part of the value, e.g. if the value first-(?<paramName>.\*) is used for first-second then second will be usable in the destination with :paramName.
Learn more about rewrites on Vercel and see limitations.

ignoreCommand
This value overrides the Ignored Build Step in Project Settings.

Type: string | null

This ignoreCommand property will override the Command for Ignoring the Build Step for a given deployment. When the command exits with code 1, the build will continue. When the command exits with 0, the build is ignored. For more information on the default behavior of the Ignore Command, visit the Ignored Build Step section.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"ignoreCommand": "git diff --quiet HEAD^ HEAD ./"
}
installCommand
This value overrides the Install Command in Project Settings.

Type: string | null

The installCommand property can be used to override the Install Command in the Project Settings dashboard for a given deployment. This setting is useful for trying out a new package manager for the project. An empty string value will cause the Install Command to be skipped. For more information on the default behavior of the install command visit the Configure a Build - Install Command section.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"installCommand": "npm install"
}
images
The images property defines the behavior of Vercel's native Image Optimization API, which allows on-demand optimization of images at runtime.

Type: Object

Value definition
sizes - Required - Array of allowed image widths. The Image Optimization API will return an error if the w parameter is not defined in this list.
localPatterns - Allow-list of local image paths which can be used with the Image Optimization API.
remotePatterns - Allow-list of external domains which can be used with the Image Optimization API.
minimumCacheTTL - Cache duration (in seconds) for the optimized images.
qualities - Array of allowed image qualities. The Image Optimization API will return an error if the q parameter is not defined in this list.
formats - Supported output image formats. Allowed values are either "image/avif" and/or "image/webp".
dangerouslyAllowSVG - Allow SVG input image URLs. This is disabled by default for security purposes.
contentSecurityPolicy - Specifies the Content Security Policy of the optimized images.
contentDispositionType - Specifies the value of the "Content-Disposition" response header. Allowed values are "inline" or "attachment".
vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
  "images": {
    "sizes": [256, 640, 1080, 2048, 3840],
    "localPatterns": [{
      "pathname": "^/assets/.*$",
"search": ""
}]
"remotePatterns": [
{
"protocol": "https",
"hostname": "example.com",
"port": "",
"pathname": "^/account123/.*$",
"search": "?v=1"
}
],
"minimumCacheTTL": 60,
"qualities": [25, 50, 75],
"formats": ["image/webp"],
"dangerouslyAllowSVG": false,
"contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;",
"contentDispositionType": "inline"
}
}
outputDirectory
This value overrides the Output Directory in Project Settings.

Type: string | null

The outputDirectory property can be used to override the Output Directory in the Project Settings dashboard for a given deployment.

In the following example, the deployment will look for the build directory rather than the default public or . root directory. For more information on the default behavior of the Output Directory see the Configure a Build - Output Directory section. The following example is a vercel.json file that overrides the outputDirectory to build:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"outputDirectory": "build"
}
public
Type: Boolean.

Default Value: false.

When set to true, both the source view and logs view will be publicly accessible.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"public": true
}
redirects
Type: Array of redirect Object.

Valid values: a list of redirect definitions.

Redirects examples
Some redirects and rewrites configurations can accidentally become gateways for semantic attacks. Learn how to check and protect your configurations with the Enhancing Security for Redirects and Rewrites guide.
This example redirects requests to the path /me from your site's root to the profile.html file relative to your site's root with a 307 Temporary Redirect:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{ "source": "/me", "destination": "/profile.html", "permanent": false }
]
}
This example redirects requests to the path /me from your site's root to the profile.html file relative to your site's root with a 308 Permanent Redirect:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{ "source": "/me", "destination": "/profile.html", "permanent": true }
]
}
This example redirects requests to the path /user from your site's root to the api route /api/user relative to your site's root with a 301 Moved Permanently:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{ "source": "/user", "destination": "/api/user", "statusCode": 301 }
]
}
This example redirects requests to the path /view-source from your site's root to the absolute path https://github.com/vercel/vercel of an external site with a redirect status of 308:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{
"source": "/view-source",
"destination": "https://github.com/vercel/vercel"
}
]
}
This example redirects requests to all the paths (including all sub-directories and pages) from your site's root to the absolute path https://vercel.com/docs of an external site with a redirect status of 308:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{
"source": "/(.*)",
"destination": "https://vercel.com/docs"
}
]
}
This example uses wildcard path matching to redirect requests to any path (including subdirectories) under /blog/ from your site's root to a corresponding path under /news/ relative to your site's root with a redirect status of 308:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{
"source": "/blog/:path*",
"destination": "/news/:path*"
}
]
}
This example uses regex path matching to redirect requests to any path under /posts/ that only contain numerical digits from your site's root to a corresponding path under /news/ relative to your site's root with a redirect status of 308:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{
"source": "/post/:path(\\d{1,})",
"destination": "/news/:path*"
}
]
}
This example redirects requests to any path from your site's root that does not start with /uk/ and has x-vercel-ip-country header value of GB to a corresponding path under /uk/ relative to your site's root with a redirect status of 307:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{
"source": "/:path((?!uk/)._)",
"has": [
{
"type": "header",
"key": "x-vercel-ip-country",
"value": "GB"
}
],
"destination": "/uk/:path_",
"permanent": false
}
]
}
Using has does not yet work locally while using vercel dev, but does work when deployed.

Redirect object definition
Property Description
source A pattern that matches each incoming pathname (excluding querystring).
destination A location destination defined as an absolute pathname or external URL.
permanent An optional boolean to toggle between permanent and temporary redirect (default true). When true, the status code is 308. When false the status code is 307.
statusCode An optional integer to define the status code of the redirect. Used when you need a value other than 307/308 from permanent, and therefore cannot be used with permanent boolean.
has An optional array of has objects with the type, key and value properties. Used for conditional redirects based on the presence of specified properties.
missing An optional array of missing objects with the type, key and value properties. Used for conditional redirects based on the absence of specified properties.
Redirect has or missing object definition
Property Type Description
type String Must be either header, cookie, host, or query.
key String The key from the selected type to match against.
value String or not defined The value to check for, if undefined any value will match. A regex like string can be used to capture a specific part of the value. See example.
Learn more about redirects on Vercel and see limitations.

regions
This value overrides the Serverless Function Region in Project Settings.

Type: Array of region identifier String.

Valid values: List of regions, defaults to iad1.

You can define the regions where your Serverless Functions are executed. Users on Pro and Enterprise can deploy to multiple regions. Hobby plans can select any single region. To learn more, see Configuring Regions.

Function responses can be cached in the requested regions. Selecting a Serverless Function region does not impact static files, which are deployed to every region by default.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"regions": ["sfo1"]
}
functionFailoverRegions
Setting failover regions for Serverless Functions are available on Enterprise plans

Set this property to specify the region to which a Serverless Function should fallback when the default region(s) are unavailable.

Type: Array of region identifier String.

Valid values: List of regions.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"functionFailoverRegions": ["iad1", "sfo1"]
}
These regions serve as a fallback to any regions specified in the regions configuration. The region Vercel selects to invoke your function depends on availability and ingress. For instance:

Vercel always attempts to invoke the function in the primary region. If you specify more than one primary region in the regions property, Vercel selects the region geographically closest to the request
If all primary regions are unavailable, Vercel automatically fails over to the regions specified in functionFailoverRegions, selecting the region geographically closest to the request
The order of the regions in functionFailoverRegions does not matter as Vercel automatically selects the region geographically closest to the request
To learn more about automatic failover for Serverless Functions, see Automatic failover. Edge Functions will automatically failover with no configuration required.

Region failover is supported with Secure Compute, see Region Failover to learn more.

Want to talk to our team?

This feature is available on the Enterprise plan.

rewrites
Type: Array of rewrite Object.

Valid values: a list of rewrite definitions.

If cleanUrls is set to true in your project's vercel.json, do not include the file extension in the source or destination path. For example, /about-our-company.html would be /about-our-company

Some redirects and rewrites configurations can accidentally become gateways for semantic attacks. Learn how to check and protect your configurations with the Enhancing Security for Redirects and Rewrites guide.
Rewrites examples
This example rewrites requests to the path /about from your site's root to the /about-our-company.html file relative to your site's root:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [
{ "source": "/about", "destination": "/about-our-company.html" }
]
}
This example rewrites all requests to the root path which is often used for a Single Page Application (SPA).

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
This example rewrites requests to the paths under /resize that with 2 paths levels (defined as variables width and height that can be used in the destination value) to the api route /api/sharp relative to your site's root:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [
{ "source": "/resize/:width/:height", "destination": "/api/sharp" }
]
}
This example uses wildcard path matching to rewrite requests to any path (including subdirectories) under /proxy/ from your site's root to a corresponding path under the root of an external site https://example.com/:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [
{
"source": "/proxy/:match*",
"destination": "https://example.com/:match*"
}
]
}
This example rewrites requests to any path from your site's root that does not start with /uk/ and has x-vercel-ip-country header value of GB to a corresponding path under /uk/ relative to your site's root:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [
{
"source": "/:path((?!uk/)._)",
"has": [
{
"type": "header",
"key": "x-vercel-ip-country",
"value": "GB"
}
],
"destination": "/uk/:path_"
}
]
}
This example rewrites requests to the path /dashboard from your site's root that does not have a cookie with key auth_token to the path /login relative to your site's root:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [
{
"source": "/dashboard",
"missing": [
{
"type": "cookie",
"key": "auth_token"
}
],
"destination": "/login"
}
]
}
Rewrite object definition
Property Description
source A pattern that matches each incoming pathname (excluding querystring).
destination A location destination defined as an absolute pathname or external URL.
permanent A boolean to toggle between permanent and temporary redirect (default true). When true, the status code is 308. When false the status code is 307.
has An optional array of has objects with the type, key and value properties. Used for conditional rewrites based on the presence of specified properties.
missing An optional array of missing objects with the type, key and value properties. Used for conditional rewrites based on the absence of specified properties.
Rewrite has or missing object definition
Property Type Description
type String Must be either header, cookie, host, or query.
key String The key from the selected type to match against.
value String or not defined The value to check for, if undefined any value will match. A regex like string can be used to capture a specific part of the value, e.g. if the value first-(?<paramName>.\*) is used for first-second then second will be usable in the destination with :paramName.
The source property should NOT be a file because precedence is given to the filesystem prior to rewrites being applied. Instead, you should rename your static file or Serverless Function.

Using has does not yet work locally while using vercel dev, but does work when deployed.

Learn more about rewrites on Vercel.

trailingSlash
Type: Boolean.

Default Value: undefined.

false
When trailingSlash: false, visiting a path that ends with a forward slash will respond with a 308 status code and redirect to the path without the trailing slash.

For example, the /about/ path will redirect to /about.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"trailingSlash": false
}
true
When trailingSlash: true, visiting a path that does not end with a forward slash will respond with a 308 status code and redirect to the path with a trailing slash.

For example, the /about path will redirect to /about/.

However, paths with a file extension will not redirect to a trailing slash.

For example, the /about/styles.css path will not redirect, but the /about/styles path will redirect to /about/styles/.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"trailingSlash": true
}
undefined
When trailingSlash: undefined, visiting a path with or without a trailing slash will not redirect.

For example, both /about and /about/ will serve the same content without redirecting.

This is not recommended because it could lead to search engines indexing two different pages with duplicate content.

Legacy
Legacy properties are still supported for backwards compatibility, but are deprecated.

name
The name property has been deprecated in favor of Project Linking, which allows you to link a Vercel project to your local codebase when you run vercel.

Type: String.

Valid values: string name for the deployment.

Limits:

A maximum length of 52 characters
Only lower case alphanumeric characters or hyphens are allowed
Cannot begin or end with a hyphen, or contain multiple consecutive hyphens
The prefix for all new deployment instances. Vercel CLI usually generates this field automatically based on the name of the directory. But if you'd like to define it explicitly, this is the way to go.

The defined name is also used to organize the deployment into a project.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"name": "example-app"
}
version
The version property should not be used anymore.

Type: Number.

Valid values: 1, 2.

Specifies the Vercel Platform version the deployment should use.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"version": 2
}
alias
The alias property should not be used anymore. To assign a custom Domain to your project, please define it in the Project Settings instead. Once your domains are, they will take precedence over the configuration property.

Type: Array or String.

Valid values: domain names (optionally including subdomains) added to the account, or a string for a suffixed URL using .vercel.app or a Custom Deployment Suffix (available on the Enterprise plan).

Limit: A maximum of 64 aliases in the array.

The alias or aliases are applied automatically using Vercel for GitHub, Vercel for GitLab, or Vercel for Bitbucket when merging or pushing to the Production Branch.

You can deploy to the defined aliases using Vercel CLI by setting the production deployment environment target.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"alias": ["my-domain.com", "my-alias"]
}
scope
The scope property has been deprecated in favor of Project Linking, which allows you to link a Vercel project to your local codebase when you run vercel.

Type: String.

Valid values: For teams, either an ID or slug. For users, either a email address, username, or ID.

This property determines the scope (Hobby team or team) under which the project will be deployed by Vercel CLI.

It also affects any other actions that the user takes within the directory that contains this configuration (e.g. listing environment variables using vercel secrets ls).

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"scope": "my-team"
}
Deployments made through Git will ignore the scope property because the repository is already connected to project.

env
We recommend against using this property. To add custom environment variables to your project define them in the Project Settings.

Type: Object of String keys and values.

Valid values: environment keys and values.

Environment variables passed to the invoked Serverless Functions.

This example will pass the MY_KEY static env to all Serverless Functions and the SECRET resolved from the my-secret-name secret dynamically.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"env": {
"MY_KEY": "this is the value",
"SECRET": "@my-secret-name"
}
}
build.env
We recommend against using this property. To add custom environment variables to your project define them in the Project Settings.

Type: Object of String keys and values inside the build Object.

Valid values: environment keys and values.

Environment variables passed to the Build processes.

The following example will pass the MY_KEY environment variable to all Builds and the SECRET resolved from the my-secret-name secret dynamically.

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"env": {
"MY_KEY": "this is the value",
"SECRET": "@my-secret-name"
}
}
builds
We recommend against using this property. To customize Serverless Functions, please use the functions property instead. If you'd like to deploy a monorepo, see the Monorepo docs.

Type: Array of build Object.

Valid values: a list of build descriptions whose src references valid source files.

Build object definition
src (String): A glob expression or pathname. If more than one file is resolved, one build will be created per matched file. It can include \* and \*\*.
use (String): An npm module to be installed by the build process. It can include a semver compatible version (e.g.: @org/proj@1).
config (Object): Optionally, an object including arbitrary metadata to be passed to the Builder.
The following will include all HTML files as-is (to be served statically), and build all Python files and JS files into Serverless Functions:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"builds": [
{ "src": "*.html", "use": "@vercel/static" },
{ "src": "*.py", "use": "@vercel/python" },
{ "src": "*.js", "use": "@vercel/node" }
]
}
When at least one builds item is specified, only the outputs of the build processes will be included in the resulting deployment as a security precaution. This is why we need to allowlist static files explicitly with @vercel/static.

routes
We recommend using cleanUrls, trailingSlash, redirects, rewrites, and/or headers instead.

The routes property is only meant to be used for advanced integration purposes, such as the Build Output API, and cannot be used in conjunction with any of the properties mentioned above.

See the upgrading routes section to learn how to migrate away from this property.

Type: Array of route Object.

Valid values: a list of route definitions.

Route object definition
src: A PCRE-compatible regular expression that matches each incoming pathname (excluding querystring).
methods: A set of HTTP method types. If no method is provided, requests with any HTTP method will be a candidate for the route.
dest: A destination pathname or full URL, including querystring, with the ability to embed capture groups as $1, $2…
headers: A set of headers to apply for responses.
status: A status code to respond with. Can be used in tandem with Location: header to implement redirects.
continue: A boolean to change matching behavior. If true, routing will continue even when the src is matched.
has: An optional array of has objects with the type, key and value properties. Used for conditional path matching based on the presence of specified properties
missing: An optional array of missing objects with the type, key and value properties. Used for conditional path matching based on the absence of specified properties
Routes are processed in the order they are defined in the array, so wildcard/catch-all patterns should usually be last.

This example configures custom routes that map to static files and Serverless Functions:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
  "routes": [
    {
      "src": "/redirect",
      "status": 308,
      "headers": { "Location": "https://example.com/" }
    },
    {
      "src": "/custom-page",
      "headers": { "cache-control": "s-maxage=1000" },
      "dest": "/index.html"
    },
    { "src": "/api", "dest": "/my-api.js" },
    { "src": "/users", "methods": ["POST"], "dest": "/users-api.js" },
    { "src": "/users/(?<id>[^/]*)", "dest": "/users-api.js?id=$id" },
{ "src": "/legacy", "status": 404 },
{ "src": "/.\*", "dest": "https://my-old-site.com" }
]
}
Upgrading legacy routes
In most cases, you can upgrade legacy routes usage to the newer rewrites, redirects, headers, cleanUrls or trailingSlash properties.

Here are some examples that show how to upgrade legacy routes to the equivalent new property.

Route Parameters
With routes, you use a PCRE Regex named group to match the ID and then pass that parameter in the query string. The following example matches a URL like /product/532004 and proxies to /api/product?id=532004:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
  "routes": [{ "src": "/product/(?<id>[^/]+)", "dest": "/api/product?id=$id" }]
}
With rewrites, named parameters are automatically passed in the query string. The following example is equivalent to the legacy routes usage above, but uses rewrites instead:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [{ "source": "/product/:id", "destination": "/api/product" }]
}
Legacy redirects
With routes, you specify the status code to use a 307 Temporary Redirect. Also, this redirect needs to be defined before other routes. The following example redirects all paths in the posts directory to the blog directory, but keeps the path in the new location:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"routes": [
{
"src": "/posts/(.*)",
"headers": { "Location": "/blog/$1" },
"status": 307
}
]
}
With redirects, you disable the permanent property to use a 307 Temporary Redirect. Also, redirects are always processed before rewrites. The following example is equivalent to the legacy routes usage above, but uses redirects instead:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"redirects": [
{
"source": "/posts/:id",
"destination": "/blog/:id",
"permanent": false
}
]
}
Legacy SPA Fallback
With routes, you use "handle": "filesystem" to give precedence to the filesystem and exit early if the requested path matched a file. The following example will serve the index.html file for all paths that do not match a file in the filesystem:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"routes": [
{ "handle": "filesystem" },
{ "src": "/(.*)", "dest": "/index.html" }
]
}
With rewrites, the filesystem check is the default behavior. If you want to change the name of files at the filesystem level, file renames can be performed during the Build Step, but not with rewrites. The following example is equivalent to the legacy routes usage above, but uses rewrites instead:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
Legacy Headers
With routes, you use "continue": true to prevent stopping at the first match. The following example adds Cache-Control headers to the favicon and other static assets:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"routes": [
{
"src": "/favicon.ico",
"headers": { "Cache-Control": "public, max-age=3600" },
"continue": true
},
{
"src": "/assets/(.*)",
"headers": { "Cache-Control": "public, max-age=31556952, immutable" },
"continue": true
}
]
}
With headers, this is no longer necessary since that is the default behavior. The following example is equivalent to the legacy routes usage above, but uses headers instead:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"headers": [
{
"source": "/favicon.ico",
"headers": [
{
"key": "Cache-Control",
"value": "public, max-age=3600"
}
]
},
{
"source": "/assets/(.\*)",
"headers": [
{
"key": "Cache-Control",
"value": "public, max-age=31556952, immutable"
}
]
}
]
}
Legacy Pattern Matching
With routes, you need to escape a dot with two backslashes, otherwise it would match any character PCRE Regex. The following example matches the literal atom.xml and proxies to /api/rss to dynamically generate RSS:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"routes": [{ "src": "/atom\\.xml", "dest": "/api/rss" }]
}
With rewrites, the . is not a special character so it does not need to be escaped. The following example is equivalent to the legacy routes usage above, but instead uses rewrites:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [{ "source": "/atom.xml", "destination": "/api/rss" }]
}
Legacy Negative Lookahead
With routes, you use PCRE Regex negative lookahead. The following example proxies all requests to the /maintenance page except for /maintenance itself to avoid infinite loop:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"routes": [{ "src": "/(?!maintenance)", "dest": "/maintenance" }]
}
With rewrites, the Regex needs to be wrapped. The following example is equivalent to the legacy routes usage above, but instead uses rewrites:

vercel.json

{
"$schema": "https://openapi.vercel.sh/vercel.json",
"rewrites": [
{ "source": "/((?!maintenance).*)", "destination": "/maintenance" }
]
}
Legacy Case Sensitivity
With routes, the src property is case-insensitive leading to duplicate content, where multiple request paths with difference cases serve the same page.

With rewrites / redirects / headers, the source property is case-sensitive so you don't accidentally create duplicate content.

## 7. 통합 API 인터페이스

올애드 플랫폼의 다른 부분과 통합하기 위한 통합 인터페이스입니다.

```typescript
// services/google-ads/google-ads-integration.service.ts
export class GoogleAdsIntegrationService {
  private campaignControl: CampaignControlService;
  private labelManagement: LabelManagementService;
  private syncService: GoogleAdsSyncService;

  constructor() {
    // 의존성 주입을 통한 서비스 초기화
  }

  // 캠페인 제어 통합 메서드
  async toggleCampaignStatus(
    accountId: string,
    campaignId: string,
    enable: boolean,
  ) {
    const status = enable ? "ENABLED" : "PAUSED";

    return this.campaignControl.updateCampaignStatus(accountId, [
      {
        campaignId,
        status,
      },
    ]);
  }

  // 라벨 기반 일괄 제어
  async toggleCampaignsByLabel(
    accountId: string,
    labelId: string,
    enable: boolean,
  ) {
    const campaigns = await this.labelManagement.getCampaignsByLabel(
      accountId,
      labelId,
    );

    const updates = campaigns.map((campaign) => ({
      campaignId: campaign.id,
      status: enable ? "ENABLED" : ("PAUSED" as const),
    }));

    return this.campaignControl.updateCampaignStatus(accountId, updates);
  }
}
```

이 설계의 핵심 특징은 다음과 같습니다:

1. **확장성**: MCC 계정을 통해 수천 개의 하위 계정을 관리할 수 있습니다
2. **효율성**: 증분 동기화로 API 할당량을 효율적으로 사용합니다
3. **안정성**: 큐 기반 처리로 대규모 데이터도 안정적으로 처리합니다
4. **모듈화**: 각 기능이 독립적으로 작동하여 유지보수가 용이합니다

---

## Project 정책

목표: 신규 사용자가 서비스에 가입하고, 광고 플랫폼 계정을 처음 연동하여 대시보드에서 데이터를 확인.
관련 페이지: 홈페이지/서비스 통합 안내, 회원가입, 로그인, 광고 계정 연동/관리, API 키/권한 발급 방법 안내, 통합 대시보드 홈.
단계별 흐름:
방문 및 정보 탐색: 사용자가 '올애드' 홈페이지에 접속하여 서비스 기능, 가치, 요금제(V1.0 무료 정책 확인) 등을 확인합니다.
회원가입: "무료 회원가입" 버튼을 통해 이메일, 비밀번호 등 정보를 입력하고 약관 동의 후 가입을 완료합니다. (필요시 이메일 인증)
최초 로그인: 가입한 정보로 서비스에 로그인합니다.
온보딩 및 계정 연동 안내: 로그인 후, 광고 계정 연동을 유도하는 안내 메시지 또는 튜토리얼을 접합니다.
광고 계정 연동 페이지 이동: '광고 계정 연동/관리' 페이지로 이동합니다.
플랫폼 선택 및 인증: 연동할 광고 플랫폼(V1.0: 구글, 메타, 쿠팡)을 선택하고, 필요시 'API 키/권한 발급 방법 안내' 페이지를 참고하여 해당 플랫폼의 API 인증(OAuth 등) 절차를 진행하고 광고 계정을 선택합니다.
데이터 동기화: 연동 성공 후, 초기 데이터 동기화가 진행되는 것을 확인합니다. (다른 플랫폼도 동일하게 연동 반복)
대시보드 확인: '통합 대시보드 홈'으로 이동하여 연동된 계정의 데이터가 정상적으로 표시되는지 확인합니다. 2. 일일 광고 성과 모니터링 (V1.0)

목표: 기존 사용자가 매일 접속하여 전반적인 광고 성과 및 플랫폼별 주요 현황을 빠르게 파악.
관련 페이지: 로그인, 통합 대시보드 홈, 플랫폼별 상세 대시보드.
단계별 흐름:
로그인: '올애드'에 로그인합니다.
통합 대시보드 확인: '통합 대시보드 홈'에서 기간 필터(오늘/어제 등)를 설정하고, 전체 광고비, 클릭, 노출, ROAS 등 핵심 KPI 및 전일 대비 변화를 확인합니다.
플랫폼별 성과 요약 확인: 통합 대시보드 내에서 각 플랫폼별 주요 성과 요약(카드 또는 차트)을 확인합니다.
심층 분석 필요시 플랫폼 이동: 특정 플랫폼의 성과에 대한 상세 분석이 필요하면, 해당 플랫폼의 '플랫폼별 상세 대시보드'로 이동하여 더 자세한 지표를 확인합니다. 3. 캠페인 상태 변경 (ON/OFF) (V1.0)

목표: 사용자가 특정 캠페인을 빠르게 중지(OFF)하거나 다시 시작(ON).
관련 페이지: 통합 캠페인 목록 및 관리, (선택) 캠페인 상세 정보, (선택) 계정 활동 및 시스템 알림.
단계별 흐름:
로그인 및 캠페인 목록 접근: '통합 캠페인 목록 및 관리' 페이지로 이동합니다.
대상 캠페인 검색/필터링: 플랫폼, 캠페인명 등으로 상태를 변경할 캠페인을 찾습니다.
상태 변경 실행: 해당 캠페인 목록 옆의 ON/OFF 토글 스위치를 클릭합니다.
확인 절차: "캠페인을 중지(또는 시작)하시겠습니까?"와 같은 확인 모달창에서 "확인"을 클릭합니다.
결과 확인: 시스템이 API를 통해 상태를 변경하고 성공/실패 피드백을 받습니다. (필요시 '계정 활동 및 시스템 알림'에서 변경 이력 확인) 4. 정기/수시 보고서 확인 및 공유 (V1.0부터 단계적)

목표: 사용자가 광고 성과 보고서를 확인하고, 필요시 팀원 또는 관계자와 공유.
관련 페이지: 통합 리포트.
단계별 흐름:
V1.0 (기본 리포트 & 엑셀 저장):
'통합 리포트' 페이지 접속 후, 기본 제공되는 리포트 템플릿(예: 일일/주간 성과)을 선택합니다.
기간을 설정하여 리포트를 조회합니다.
필요시 "엑셀 다운로드" 기능을 사용하여 데이터를 로컬에 저장하고 수동으로 공유합니다.
V1.2 이후 (커스텀 리포트 & 자동 발송):
'통합 리포트' 페이지에서 '커스텀 리포트 빌더'를 사용하여 원하는 지표, 기간, 필터로 맞춤 보고서를 생성하고 저장합니다.
저장된 리포트를 선택하여 조회하거나, '리포트 자동 발송 설정'을 통해 특정 이메일 주소로 주기적으로 자동 발송하도록 설정합니다. 5. 팀원 초대 및 관리 (V1.0)

목표: Master 사용자가 팀원을 서비스에 초대하고 역할을 관리.
관련 페이지: 팀 관리 (설정 내).
단계별 흐름 (Master 사용자):
'설정' 메뉴의 '팀 관리' 페이지로 이동합니다.
"팀원 초대" 버튼을 클릭합니다.
초대할 팀원의 이메일 주소를 입력하고, 역할(Team Mate, Viewer)을 선택한 후 초대를 보냅니다.
초대된 사용자가 수락하면 팀원 목록에 추가됩니다.
기존 팀원의 역할을 변경하거나 팀에서 제외할 수 있습니다.
단계별 흐름 (초대받은 사용자):
초대 이메일을 수신하고, 이메일 내 링크를 클릭합니다.
'올애드' 회원가입(최초) 또는 로그인하여 팀에 합류합니다. 6. 성과 기반 알림 설정 및 확인 (V1.2 이후)

목표: 사용자가 중요한 성과 변화나 예산 관련 이슈에 대해 자동으로 알림을 받도록 설정하고 확인.
관련 페이지: 알림 설정, 계정 활동 및 시스템 알림.
단계별 흐름:
'알림 설정' 페이지로 이동합니다.
"새 알림 규칙 만들기"를 통해 예산 소진율 또는 주요 KPI(CPA, ROAS 등) 임계값 조건을 설정합니다.
알림을 받을 채널(이메일, 슬랙 등)을 선택하고 저장합니다.
설정한 조건이 충족되면, 지정된 채널 또는 '계정 활동 및 시스템 알림' 페이지를 통해 알림을 확인합니다. 7. AI 성과 피드백 확인 (V2.0 이후)

목표: 사용자가 AI가 제공하는 캠페인 성과 분석 및 개선 제안을 확인.
관련 페이지: AI 성과 분석/피드백.
단계별 흐름:
'AI 성과 분석/피드백' 페이지로 이동합니다.
분석을 원하는 캠페인 또는 전체 계정의 AI 분석 결과를 확인합니다. (성과 요약, 개선 제안 등)
AI 제안을 검토하고, 실제 캠페인 운영에 반영할지 결정합니다. 8. 자동화 규칙 설정 및 모니터링 (V2.0 이후)

목표: 사용자가 특정 조건에 따라 광고 운영 작업(예: 캠페인 ON/OFF)이 자동으로 실행되도록 규칙을 설정하고 관리.
관련 페이지: 규칙 기반 자동화 설정/관리, 자동화 실행 로그.
단계별 흐름:
'규칙 기반 자동화 설정' 페이지로 이동합니다.
"새 규칙 만들기"를 통해 IF(조건: 특정 지표, 기간) - THEN(액션: 캠페인 ON/OFF, 예산 조정 등) 형식의 규칙을 생성하고 활성화합니다.
'자동화 실행 로그' 페이지에서 규칙이 정상적으로 작동하는지 모니터링합니다.
2.2 타겟 사용자 세그먼트 (수정된 내용)

Primary Target (주요 타겟): 1인 기업부터 중견기업까지, 특히 마케팅 툴 사용에 익숙하지 않거나 1인이 다수의 광고 채널 운영 및 기타 업무를 동시에 처리해야 하는 환경에 놓인 담당자 및 사업주를 핵심 타겟으로 합니다. 이들은 시간 부족과 여러 플랫폼 관리의 복잡함으로 인해 광고 운영 효율화 및 통합 리포팅에 대한 니즈가 매우 큽니다.
Overall Target (전체 타겟): 광고 채널 수나 데이터 분석 수준에 관계없이, 두 개 이상의 광고 플랫폼을 운영하는 모든 개인 및 기업을 잠재 고객으로 설정합니다. '올애드'를 통해 자연스럽게 데이터 기반 의사결정을 경험하도록 지원하는 것을 목표로 합니다.
5.2 요금제 구조 (새로운 버전별 계획)

버전 1 (초기 출시 버전):

가격 모델: 전체 무료
이용 가능 플랫폼: 구글(Google Ads), 메타(Meta Ads)
이용 가능 인원: 계정당 최대 5명
API 호출 제한: 호출 횟수 자체는 무제한이나, 데이터 업데이트는 시간당 1회로 제한
버전 2 (기능 확장 후):

가격 모델: 부분 무료 (Freemium) 및 구독 기반
요금제 세부 구조:
Free Plan:
이용 가능 플랫폼: 구글(Google Ads), 메타(Meta Ads)
이용 가능 인원: 계정당 최대 2명
API 호출 제한: 1일 2회 (데이터 업데이트 주기)
Starter Plan: (유료)
Free Plan 모든 기능 포함
추가 연동 플랫폼: 네이버 광고(Naver Ads), 쿠팡 애즈(Coupang Ads)
이용 가능 인원: 계정당 최대 3명
API 호출 제한: 1일 3회
Plus Plan: (유료)
Starter Plan 모든 기능 포함
추가 연동 플랫폼: 올애드에서 제공하는 모든 플랫폼 연동 가능
이용 가능 인원: 계정당 최대 5명
API 호출 제한: 1일 5회
Pro Plan: (유료)
Plus Plan 모든 기능 포함
API 호출 제한: 무제한 (실시간 또는 매우 빈번한 데이터 업데이트 가능)
이용 가능 인원: 계정당 최대 10명
사용자 역할 및 구조

1. Master (마스터):

권한: 계정 내 모든 설정 및 기능에 접근하고 관리할 수 있는 최상위 관리자입니다.
주요 기능:
광고 플랫폼 계정 연동 및 해제
요금제 관리 및 결제 정보 변경
모든 대시보드 및 리포트 생성, 조회, 수정, 삭제
모든 캠페인 데이터 조회
모든 캠페인 관리 기능 사용 (ON/OFF, 예산 변경, 생성, 수정, 삭제 등 - 향후 구현될 기능 포함)
모든 사용자(Master, Team Mate, Viewer) 초대, 역할 변경, 삭제
서비스 관련 모든 알림 및 설정 변경
용도: 계정 소유자, 핵심 관리자, 에이전시 대표 등 2. Team Mate (팀 메이트):

권한: 광고 캠페인 운영 및 관리에 필요한 주요 편집 권한과 하위 사용자 초대 권한을 가집니다.
주요 기능:
할당된 또는 전체 광고 플랫폼 데이터 조회
대시보드 및 리포트 조회 (생성/수정 권한은 Master가 부여 가능 여부 결정 필요)
담당 캠페인 편집 가능 (ON/OFF, 예산 변경, 타겟팅 수정 등 - 향후 구현될 기능 포함)
신규 사용자 초대 (초대 가능한 역할 범위는 Master가 설정)
캠페인 성과 관련 알림 수신
용도: 실무 마케터, 캠페인 운영 담당자, 에이전시 팀원 등 3. Viewer (뷰어):

권한: 데이터 조회만 가능한 읽기 전용 사용자입니다.
주요 기능:
할당된 광고 플랫폼 데이터 및 대시보드, 리포트 조회
모든 편집 및 설정 변경 불가
사용자 초대 불가
용도: 성과 보고를 받아보는 클라이언트, 의사결정을 위한 데이터 참고가 필요한 내부 임원 또는 팀원 등

All-AD 통합 광고 관리 플랫폼 정책서 1. 프로젝트 개요 1.1 비전 및 미션 All-AD는 분산된 광고 플랫폼 환경에서 광고주들이 겪는 복잡성을 해결하기 위한 통합 광고 관리 솔루션입니다. 단일 대시보드에서 모든 광고 캠페인을 관리하고 분석할 수 있는 원스톱 플랫폼을 제공하여, 광고 운영의 효율성을 극대화하고 데이터 기반의 의사결정을 지원합니다. 1.2 핵심 가치 제안 광고주들은 더 이상 여러 플랫폼을 오가며 데이터를 수집하고 분석할 필요가 없습니다. All-AD는 모든 광고 데이터를 한 곳에서 통합 관리하여 시간과 비용을 절감하고, 통합된 인사이트를 통해 더 나은 광고 성과를 달성할 수 있도록 지원합니다. 2. 시장 분석 및 타겟 고객 2.1 목표 시장 디지털 광고 시장은 지속적으로 성장하고 있으며, 광고 플랫폼의 다양화로 인해 통합 관리 솔루션에 대한 수요가 증가하고 있습니다. 특히 중소기업부터 대기업까지 멀티 플랫폼 광고를 운영하는 모든 규모의 광고주가 우리의 잠재 고객입니다. 2.2 타겟 사용자 세그먼트 Primary Target: 다수의 광고 플랫폼을 동시에 운영하는 중견기업의 마케팅 담당자들입니다. 이들은 효율적인 광고 관리와 통합 리포팅을 필요로 합니다. Secondary Target: 광고 대행사와 퍼포먼스 마케팅 에이전시입니다. 다수의 클라이언트를 관리하며 효율적인 캠페인 운영과 리포팅 자동화를 원합니다. Tertiary Target: 데이터 기반 의사결정을 중시하는 스타트업과 이커머스 기업들입니다. 3. 핵심 기능 및 서비스 3.1 통합 대시보드 모든 광고 플랫폼의 핵심 지표를 실시간으로 모니터링할 수 있는 중앙 집중식 대시보드를 제공합니다. 사용자는 커스터마이징 가능한 위젯을 통해 필요한 정보를 한눈에 확인할 수 있습니다. 3.2 멀티 플랫폼 연동 다양한 광고 플랫폼과의 유연한 연동을 지원합니다. SDK 연동, Open API 연동, DB to DB 연동 등 각 플랫폼의 특성에 맞는 최적의 연동 방식을 제공하여 데이터의 정확성과 실시간성을 보장합니다. 3.3 통합 리포팅 및 분석 여러 플랫폼의 데이터를 통합하여 의미 있는 인사이트를 도출합니다. Apache ECharts를 활용한 고급 시각화 기능으로 복잡한 데이터를 직관적으로 이해할 수 있도록 지원합니다. 3.4 자동화 기능 반복적인 광고 운영 작업을 자동화하여 운영 효율성을 높입니다. 규칙 기반 자동화와 AI 기반 최적화 기능을 통해 광고 성과를 지속적으로 개선합니다. 4. 차별화 전략 4.1 기술적 우위 Next.js 15의 최신 기능을 활용한 빠른 성능과 우수한 사용자 경험을 제공합니다. 서버 컴포넌트와 Server Actions를 통해 실시간 데이터 처리와 빠른 응답 속도를 보장합니다. 4.2 유연한 확장성 모듈화된 아키텍처를 통해 새로운 광고 플랫폼 연동을 쉽게 추가할 수 있습니다. 의존성 주입과 제어 역전 패턴을 적용하여 유지보수성과 확장성을 극대화했습니다. 4.3 사용자 중심 설계 Hero UI를 기반으로 한 일관된 디자인 시스템으로 직관적이고 사용하기 쉬운 인터페이스를 제공합니다. 사용자의 워크플로우를 최적화하여 학습 곡선을 최소화했습니다. 5. 수익 모델 5.1 구독 기반 SaaS 모델 월간 또는 연간 구독 방식의 티어별 요금제를 제공합니다. 연동 플랫폼 수, 관리 계정 수, 데이터 처리량에 따라 차등화된 요금 체계를 적용합니다. 5.2 요금제 구조 Starter Plan: 소규모 광고주를 위한 기본 플랜으로, 최대 3개 플랫폼 연동과 기본 리포팅 기능을 제공합니다. Professional Plan: 중견 기업을 위한 플랜으로, 무제한 플랫폼 연동과 고급 분석 기능, 자동화 기능을 포함합니다. Enterprise Plan: 대기업과 에이전시를 위한 맞춤형 솔루션으로, 전담 지원과 커스터마이징 기능을 제공합니다. 6. 개발 로드맵 Phase 1: MVP 개발 (3개월) 핵심 광고 플랫폼 3개 연동 (Google Ads, Facebook Ads, Naver 광고) 기본 대시보드 및 리포팅 기능 구현 사용자 인증 및 권한 관리 시스템 구축 Phase 2: 기능 확장 (3개월) 추가 광고 플랫폼 연동 (카카오, 인스타그램, 유튜브 등) 고급 분석 및 시각화 기능 추가 자동화 규칙 엔진 개발 Phase 3: 고도화 (6개월) AI 기반 인사이트 및 추천 기능 멀티 테넌시 지원 API 개방 및 써드파티 연동 7. 리스크 관리 7.1 기술적 리스크 광고 플랫폼 API의 변경이나 제한에 대응하기 위한 유연한 아키텍처 설계가 필요합니다. 정기적인 모니터링과 빠른 업데이트 체계를 구축하여 서비스 중단을 최소화합니다. 7.2 보안 및 규정 준수 광고 데이터의 민감성을 고려하여 엄격한 보안 정책을 적용합니다. GDPR, 개인정보보호법 등 관련 규정을 준수하며, 정기적인 보안 감사를 실시합니다. 7.3 시장 경쟁 기존 경쟁사와의 차별화를 위해 지속적인 혁신과 사용자 피드백 반영이 필요합니다. 빠른 제품 개선 사이클과 우수한 고객 지원으로 경쟁 우위를 확보합니다. 8. 성공 지표 (KPI) 8.1 비즈니스 지표 월간 활성 사용자 수 (MAU) 유료 전환율 고객 이탈률 (Churn Rate) 월간 반복 수익 (MRR) 8.2 제품 지표 플랫폼 연동 성공률 대시보드 로딩 속도 데이터 처리 정확도 사용자 만족도 (NPS) 9. 결론 All-AD는 단순한 광고 관리 도구를 넘어, 광고주의 비즈니스 성장을 지원하는 전략적 파트너로 자리매김할 것입니다. 기술적 우수성과 사용자 중심의 설계를 바탕으로, 디지털 광고 생태계의 복잡성을 해결하고 모든 규모의 광고주가 데이터 기반의 스마트한 광고 운영을 할 수 있도록 지원하겠습니다. 2.2 타겟 사용자 세그먼트 (수정된 내용) Primary Target (주요 타겟): 1인 기업부터 중견기업까지, 특히 마케팅 툴 사용에 익숙하지 않거나 1인이 다수의 광고 채널 운영 및 기타 업무를 동시에 처리해야 하는 환경에 놓인 담당자 및 사업주를 핵심 타겟으로 합니다. 이들은 시간 부족과 여러 플랫폼 관리의 복잡함으로 인해 광고 운영 효율화 및 통합 리포팅에 대한 니즈가 매우 큽니다. Overall Target (전체 타겟): 광고 채널 수나 데이터 분석 수준에 관계없이, 두 개 이상의 광고 플랫폼을 운영하는 모든 개인 및 기업을 잠재 고객으로 설정합니다. '올애드'를 통해 자연스럽게 데이터 기반 의사결정을 경험하도록 지원하는 것을 목표로 합니다. 5.2 요금제 구조 (새로운 버전별 계획) 버전 1 (초기 출시 버전): 가격 모델: 전체 무료 이용 가능 플랫폼: 구글(Google Ads), 메타(Meta Ads) 이용 가능 인원: 계정당 최대 5명 API 호출 제한: 호출 횟수 자체는 무제한이나, 데이터 업데이트는 시간당 1회로 제한 버전 2 (기능 확장 후): 가격 모델: 부분 무료 (Freemium) 및 구독 기반 요금제 세부 구조: Free Plan: 이용 가능 플랫폼: 구글(Google Ads), 메타(Meta Ads) 이용 가능 인원: 계정당 최대 2명 API 호출 제한: 1일 2회 (데이터 업데이트 주기) Starter Plan: (유료) Free Plan 모든 기능 포함 추가 연동 플랫폼: 네이버 광고(Naver Ads), 쿠팡 애즈(Coupang Ads) 이용 가능 인원: 계정당 최대 3명 API 호출 제한: 1일 3회 Plus Plan: (유료) Starter Plan 모든 기능 포함 추가 연동 플랫폼: 올애드에서 제공하는 모든 플랫폼 연동 가능 이용 가능 인원: 계정당 최대 5명 API 호출 제한: 1일 5회 Pro Plan: (유료) Plus Plan 모든 기능 포함 API 호출 제한: 무제한 (실시간 또는 매우 빈번한 데이터 업데이트 가능) 이용 가능 인원: 계정당 최대 10명 사용자 역할 및 구조 1. Master (마스터): 권한: 계정 내 모든 설정 및 기능에 접근하고 관리할 수 있는 최상위 관리자입니다. 주요 기능: 광고 플랫폼 계정 연동 및 해제 요금제 관리 및 결제 정보 변경 모든 대시보드 및 리포트 생성, 조회, 수정, 삭제 모든 캠페인 데이터 조회 모든 캠페인 관리 기능 사용 (ON/OFF, 예산 변경, 생성, 수정, 삭제 등 - 향후 구현될 기능 포함) 모든 사용자(Master, Team Mate, Viewer) 초대, 역할 변경, 삭제 서비스 관련 모든 알림 및 설정 변경 용도: 계정 소유자, 핵심 관리자, 에이전시 대표 등 2. Team Mate (팀 메이트): 권한: 광고 캠페인 운영 및 관리에 필요한 주요 편집 권한과 하위 사용자 초대 권한을 가집니다. 주요 기능: 할당된 또는 전체 광고 플랫폼 데이터 조회 대시보드 및 리포트 조회 (생성/수정 권한은 Master가 부여 가능 여부 결정 필요) 담당 캠페인 편집 가능 (ON/OFF, 예산 변경, 타겟팅 수정 등 - 향후 구현될 기능 포함) 신규 사용자 초대 (초대 가능한 역할 범위는 Master가 설정) 캠페인 성과 관련 알림 수신 용도: 실무 마케터, 캠페인 운영 담당자, 에이전시 팀원 등 3. Viewer (뷰어): 권한: 데이터 조회만 가능한 읽기 전용 사용자입니다. 주요 기능: 할당된 광고 플랫폼 데이터 및 대시보드, 리포트 조회 모든 편집 및 설정 변경 불가 사용자 초대 불가 용도: 성과 보고를 받아보는 클라이언트, 의사결정을 위한 데이터 참고가 필요한 내부 임원 또는 팀원 등 4. 최고 운영자 계정 (King of Master ID - '올애드' 내부 관리용): 정의: 이 계정은 '올애드(All-AD)' 서비스 운영팀 내부에서 사용하는 특수 관리 계정으로, 일반 사용자에게 할당되거나 직접 제공되지 않습니다. 주요 목적: 고객 지원: 사용자의 명시적인 요청 또는 동의가 있을 경우, 기술적 문제 해결, 복잡한 설정 지원, 오류 진단 등을 위해 해당 사용자 계정에 접근하여 지원합니다. 시스템 유지보수: 서비스의 안정성 확보, 데이터 무결성 검증, 시스템 업데이트 등 내부적인 시스템 관리 및 운영을 위해 사용됩니다. 계정 관련 긴급 상황 대응: 사용자의 계정 복구 지원(정상적인 절차로 불가능할 경우) 등 긴급한 문제 해결을 위해 사용될 수 있습니다. 권한 및 통제: 이론적으로 서비스 내 모든 사용자 계정 및 데이터에 대한 접근 권한을 가질 수 있으나, 실제 접근은 엄격한 내부 보안 정책, 다중 인증(MFA), 접근 통제 프로토콜, 명확한 승인 절차에 따라 제한적으로 허용됩니다. 모든 접근 및 작업 내역은 상세한 감사 로그(Audit Log)로 기록되어 투명성과 책임성을 확보합니다. 운영팀의 계정 접근은 개인정보보호법 등 관련 법규를 철저히 준수하며, 이용약관 및 개인정보처리방침에 명시된 절차에 따라 필요한 경우 사용자에게 고지되거나 동의를 구하는 것을 원칙으로 합니다. 성격: 일반적인 사용자 역할과 달리, 서비스 제공 및 유지를 위한 내부 운영 및 기술 지원을 위한 관리자 권한입니다

### Redis Next app Example

```ts
import { createClient } from "redis";
import { NextResponse } from "next/server";

const redis = await createClient({ url: process.env.REDIS_URL }).connect();

export async function GET() {
  const value = await redis.get("myKey");

  return NextResponse.json({ value });
}
```

### Infinite Scroll Table

import React from "react";
import {
Table,
TableHeader,
TableColumn,
TableBody,
TableRow,
TableCell,
Input,
Button,
DropdownTrigger,
Dropdown,
DropdownMenu,
DropdownItem,
Chip,
User,
Pagination,
} from "@heroui/react";

export const columns = [
{name: "ID", uid: "id", sortable: true},
{name: "NAME", uid: "name", sortable: true},
{name: "AGE", uid: "age", sortable: true},
{name: "ROLE", uid: "role", sortable: true},
{name: "TEAM", uid: "team"},
{name: "EMAIL", uid: "email"},
{name: "STATUS", uid: "status", sortable: true},
{name: "ACTIONS", uid: "actions"},
];

export const statusOptions = [
{name: "Active", uid: "active"},
{name: "Paused", uid: "paused"},
{name: "Vacation", uid: "vacation"},
];

export const users = [
{
id: 1,
name: "Tony Reichert",
role: "CEO",
team: "Management",
status: "active",
age: "29",
avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
email: "tony.reichert@example.com",
},
{
id: 2,
name: "Zoey Lang",
role: "Tech Lead",
team: "Development",
status: "paused",
age: "25",
avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
email: "zoey.lang@example.com",
},
{
id: 3,
name: "Jane Fisher",
role: "Sr. Dev",
team: "Development",
status: "active",
age: "22",
avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
email: "jane.fisher@example.com",
},
{
id: 4,
name: "William Howard",
role: "C.M.",
team: "Marketing",
status: "vacation",
age: "28",
avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d",
email: "william.howard@example.com",
},
{
id: 5,
name: "Kristen Copper",
role: "S. Manager",
team: "Sales",
status: "active",
age: "24",
avatar: "https://i.pravatar.cc/150?u=a092581d4ef9026700d",
email: "kristen.cooper@example.com",
},
{
id: 6,
name: "Brian Kim",
role: "P. Manager",
team: "Management",
age: "29",
avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
email: "brian.kim@example.com",
status: "active",
},
{
id: 7,
name: "Michael Hunt",
role: "Designer",
team: "Design",
status: "paused",
age: "27",
avatar: "https://i.pravatar.cc/150?u=a042581f4e29027007d",
email: "michael.hunt@example.com",
},
{
id: 8,
name: "Samantha Brooks",
role: "HR Manager",
team: "HR",
status: "active",
age: "31",
avatar: "https://i.pravatar.cc/150?u=a042581f4e27027008d",
email: "samantha.brooks@example.com",
},
{
id: 9,
name: "Frank Harrison",
role: "F. Manager",
team: "Finance",
status: "vacation",
age: "33",
avatar: "https://i.pravatar.cc/150?img=4",
email: "frank.harrison@example.com",
},
{
id: 10,
name: "Emma Adams",
role: "Ops Manager",
team: "Operations",
status: "active",
age: "35",
avatar: "https://i.pravatar.cc/150?img=5",
email: "emma.adams@example.com",
},
{
id: 11,
name: "Brandon Stevens",
role: "Jr. Dev",
team: "Development",
status: "active",
age: "22",
avatar: "https://i.pravatar.cc/150?img=8",
email: "brandon.stevens@example.com",
},
{
id: 12,
name: "Megan Richards",
role: "P. Manager",
team: "Product",
status: "paused",
age: "28",
avatar: "https://i.pravatar.cc/150?img=10",
email: "megan.richards@example.com",
},
{
id: 13,
name: "Oliver Scott",
role: "S. Manager",
team: "Security",
status: "active",
age: "37",
avatar: "https://i.pravatar.cc/150?img=12",
email: "oliver.scott@example.com",
},
{
id: 14,
name: "Grace Allen",
role: "M. Specialist",
team: "Marketing",
status: "active",
age: "30",
avatar: "https://i.pravatar.cc/150?img=16",
email: "grace.allen@example.com",
},
{
id: 15,
name: "Noah Carter",
role: "IT Specialist",
team: "I. Technology",
status: "paused",
age: "31",
avatar: "https://i.pravatar.cc/150?img=15",
email: "noah.carter@example.com",
},
{
id: 16,
name: "Ava Perez",
role: "Manager",
team: "Sales",
status: "active",
age: "29",
avatar: "https://i.pravatar.cc/150?img=20",
email: "ava.perez@example.com",
},
{
id: 17,
name: "Liam Johnson",
role: "Data Analyst",
team: "Analysis",
status: "active",
age: "28",
avatar: "https://i.pravatar.cc/150?img=33",
email: "liam.johnson@example.com",
},
{
id: 18,
name: "Sophia Taylor",
role: "QA Analyst",
team: "Testing",
status: "active",
age: "27",
avatar: "https://i.pravatar.cc/150?img=29",
email: "sophia.taylor@example.com",
},
{
id: 19,
name: "Lucas Harris",
role: "Administrator",
team: "Information Technology",
status: "paused",
age: "32",
avatar: "https://i.pravatar.cc/150?img=50",
email: "lucas.harris@example.com",
},
{
id: 20,
name: "Mia Robinson",
role: "Coordinator",
team: "Operations",
status: "active",
age: "26",
avatar: "https://i.pravatar.cc/150?img=45",
email: "mia.robinson@example.com",
},
];

export function capitalize(s) {
return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
}

const statusColorMap = {
active: "success",
paused: "danger",
vacation: "warning",
};

const INITIAL_VISIBLE_COLUMNS = ["name", "role", "status", "actions"];

export default function App() {
const [filterValue, setFilterValue] = React.useState("");
const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
const [visibleColumns, setVisibleColumns] = React.useState(new Set(INITIAL_VISIBLE_COLUMNS));
const [statusFilter, setStatusFilter] = React.useState("all");
const [rowsPerPage, setRowsPerPage] = React.useState(5);
const [sortDescriptor, setSortDescriptor] = React.useState({
column: "age",
direction: "ascending",
});
const [page, setPage] = React.useState(1);

const pages = Math.ceil(users.length / rowsPerPage);

const hasSearchFilter = Boolean(filterValue);

const headerColumns = React.useMemo(() => {
if (visibleColumns === "all") return columns;

    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));

}, [visibleColumns]);

const filteredItems = React.useMemo(() => {
let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(statusFilter).includes(user.status),
      );
    }

    return filteredUsers;

}, [users, filterValue, statusFilter]);

const items = React.useMemo(() => {
const start = (page - 1) \* rowsPerPage;
const end = start + rowsPerPage;

    return filteredItems.slice(start, end);

}, [page, filteredItems, rowsPerPage]);

const sortedItems = React.useMemo(() => {
return [...items].sort((a, b) => {
const first = a[sortDescriptor.column];
const second = b[sortDescriptor.column];
const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });

}, [sortDescriptor, items]);

const renderCell = React.useCallback((user, columnKey) => {
const cellValue = user[columnKey];

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{radius: "full", size: "sm", src: user.avatar}}
            classNames={{
              description: "text-default-500",
            }}
            description={user.email}
            name={cellValue}
          >
            {user.email}
          </User>
        );
      case "role":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
            <p className="text-bold text-tiny capitalize text-default-500">{user.team}</p>
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize border-none gap-1 text-default-600"
            color={statusColorMap[user.status]}
            size="sm"
            variant="dot"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown className="bg-background border-1 border-default-200">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <VerticalDotsIcon className="text-default-400" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="view">View</DropdownItem>
                <DropdownItem key="edit">Edit</DropdownItem>
                <DropdownItem key="delete">Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue;
    }

}, []);

const onRowsPerPageChange = React.useCallback((e) => {
setRowsPerPage(Number(e.target.value));
setPage(1);
}, []);

const onSearchChange = React.useCallback((value) => {
if (value) {
setFilterValue(value);
setPage(1);
} else {
setFilterValue("");
}
}, []);

const topContent = React.useMemo(() => {
return (

<div className="flex flex-col gap-4">
<div className="flex justify-between gap-3 items-end">
<Input
isClearable
classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
placeholder="Search by name..."
size="sm"
startContent={<SearchIcon className="text-default-300" />}
value={filterValue}
variant="bordered"
onClear={() => setFilterValue("")}
onValueChange={onSearchChange}
/>
<div className="flex gap-3">
<Dropdown>
<DropdownTrigger className="hidden sm:flex">
<Button
endContent={<ChevronDownIcon className="text-small" />}
size="sm"
variant="flat" >
Status
</Button>
</DropdownTrigger>
<DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
{statusOptions.map((status) => (
<DropdownItem key={status.uid} className="capitalize">
{capitalize(status.name)}
</DropdownItem>
))}
</DropdownMenu>
</Dropdown>
<Dropdown>
<DropdownTrigger className="hidden sm:flex">
<Button
endContent={<ChevronDownIcon className="text-small" />}
size="sm"
variant="flat" >
Columns
</Button>
</DropdownTrigger>
<DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
{columns.map((column) => (
<DropdownItem key={column.uid} className="capitalize">
{capitalize(column.name)}
</DropdownItem>
))}
</DropdownMenu>
</Dropdown>
<Button className="bg-foreground text-background" endContent={<PlusIcon />} size="sm">
Add New
</Button>
</div>
</div>
<div className="flex justify-between items-center">
<span className="text-default-400 text-small">Total {users.length} users</span>
<label className="flex items-center text-default-400 text-small">
Rows per page:
<select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
<option value="5">5</option>
<option value="10">10</option>
<option value="15">15</option>
</select>
</label>
</div>
</div>
);
}, [
filterValue,
statusFilter,
visibleColumns,
onSearchChange,
onRowsPerPageChange,
users.length,
hasSearchFilter,
]);

const bottomContent = React.useMemo(() => {
return (

<div className="py-2 px-2 flex justify-between items-center">
<Pagination
showControls
classNames={{
            cursor: "bg-foreground text-background",
          }}
color="default"
isDisabled={hasSearchFilter}
page={page}
total={pages}
variant="light"
onChange={setPage}
/>
<span className="text-small text-default-400">
{selectedKeys === "all"
? "All items selected"
: `${selectedKeys.size} of ${items.length} selected`}
</span>
</div>
);
}, [selectedKeys, items.length, page, pages, hasSearchFilter]);

const classNames = React.useMemo(
() => ({
wrapper: ["max-h-[382px]", "max-w-3xl"],
th: ["bg-transparent", "text-default-500", "border-b", "border-divider"],
td: [
// changing the rows border radius
// first
"group-data-[first=true]/tr:first:before:rounded-none",
"group-data-[first=true]/tr:last:before:rounded-none",
// middle
"group-data-[middle=true]/tr:before:rounded-none",
// last
"group-data-[last=true]/tr:first:before:rounded-none",
"group-data-[last=true]/tr:last:before:rounded-none",
],
}),
[],
);

return (

<Table
isCompact
removeWrapper
aria-label="Example table with custom cells, pagination and sorting"
bottomContent={bottomContent}
bottomContentPlacement="outside"
checkboxesProps={{
        classNames: {
          wrapper: "after:bg-foreground after:text-background text-background",
        },
      }}
classNames={classNames}
selectedKeys={selectedKeys}
selectionMode="multiple"
sortDescriptor={sortDescriptor}
topContent={topContent}
topContentPlacement="outside"
onSelectionChange={setSelectedKeys}
onSortChange={setSortDescriptor} >
<TableHeader columns={headerColumns}>
{(column) => (
<TableColumn
key={column.uid}
align={column.uid === "actions" ? "center" : "start"}
allowsSorting={column.sortable} >
{column.name}
</TableColumn>
)}
</TableHeader>
<TableBody emptyContent={"No users found"} items={sortedItems}>
{(item) => (
<TableRow key={item.id}>
{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
</TableRow>
)}
</TableBody>
</Table>
);
}

/_ eslint-disable react-hooks/exhaustive-deps _/
import React, {
forwardRef,
ReactNode,
useImperativeHandle,
useMemo,
useEffect,
useRef,
} from 'react';
import useSWRInfinite from 'swr/infinite';
import { Spinner } from '@heroui/spinner';
import {
Table,
TableHeader,
TableColumn,
TableBody,
TableRow,
TableCell,
getKeyValue,
TableProps,
} from '@heroui/table';
import { Key, SortDescriptor } from '@react-types/shared';
import { v4 as uuidv4 } from 'uuid';
import { InfiniteTableSkeleton } from './skeleton';
import clsx from 'clsx';

export interface ListResponse<T> {
data: T[];
dataCnt?: number;
}

export interface ListContainerHandle {
refresh: () => Promise<ListResponse<any>[] | undefined>;
loadMore: () => void;
setSize: (size: number | ((prev: number) => number)) => void;
mutate: () => Promise<ListResponse<any>[] | undefined>;
}

export interface ListContainerTableProps<T> {
getKey: (pageIndex: number, previousPageData: ListResponse<T> | null) => any;
fetcher: (key: any, ...args: any[]) => Promise<ListResponse<T>>;
headerColumns: Array<{
uid: string;
name: string;
sortable?: boolean;
width?: number;
className?: string;
}>;
renderRow: (p: { item: T; columnKey: Key; value: any; userKey: Key }) => React.ReactNode;
initialSize?: number;
tableClassName?: string;
containerClassName?: string;
onSortChange?: TableProps['onSortChange'];
sortDescriptor?: SortDescriptor;
heightVh?: number;
onChangePage?: (page: number) => void;
onChangeLoading?: (loading: boolean) => void;
}

function ListContainer<T>(
props: ListContainerTableProps<T>,
ref: React.ForwardedRef<ListContainerHandle>,
): ReactNode {
const {
getKey,
fetcher,
headerColumns,
renderRow,
initialSize = 1,
tableClassName,
onSortChange,
sortDescriptor,
onChangePage,
onChangeLoading,
heightVh,
} = props;

const { data, error, setSize, isValidating, mutate, isLoading } = useSWRInfinite<ListResponse<T>>(
getKey,
fetcher,
{
initialSize,
refreshInterval: 60000, // 60초마다 자동 재검증
revalidateOnFocus: false,
revalidateOnReconnect: false,
revalidateFirstPage: false, // 기본값이 true이므로 제거 가능
dedupingInterval: 2000, // 기본값 또는 refreshInterval보다 낮은 값 사용
revalidateOnMount: true,
},
);
useEffect(() => {
onChangeLoading?.(isLoading || isValidating);
}, [isLoading, isValidating]);

// 각 페이지 데이터를 단일 배열로 결합하고 각 아이템에 고유 key 부여
const items = data
? data.flatMap((page) => page.data.map((item) => ({ ...item, key: uuidv4() })))
: [];

// API에서 총 건수(dataCnt)가 제공되면 이를 사용, 아니면 items.length로 대체
const totalCnt = data && data[0]?.dataCnt && data[0].dataCnt > 0 ? data[0].dataCnt : items.length;
// 마지막 페이지의 아이템 개수
const lastPageCount = (data && data[data.length - 1]?.data.length) || 0;
// API 요청 시 사용하는 예상 페이지 사이즈 (실제 API 기준에 맞게 조정)
const expectedPageSize = 20;

// 다음 페이지 호출 여부 계산
const hasMore = useMemo(() => {
if (data && data[0]?.dataCnt) {
return items.length < totalCnt;
}
// 총 건수가 없는 경우, 마지막 페이지의 아이템 수가 예상 페이지 사이즈와 같으면 추가 데이터가 있다고 가정
return lastPageCount === expectedPageSize;
}, [data, items.length, totalCnt, lastPageCount]);

// 스크롤 컨테이너 ref 및 bottomContent(ref) 생성
const containerRef = useRef<HTMLDivElement>(null);
const bottomContentRef = useRef<HTMLDivElement>(null);

// 실제로 로드하는 함수
const loadMore = () => {
if (!isValidating && hasMore) {
setSize((prevSize) => {
onChangePage?.(prevSize + 1);
return prevSize + 1;
});
}
};

// IntersectionObserver를 사용하여 bottomContent가 화면에 보일 때 loadMore 호출
useEffect(() => {
const container = containerRef.current;
const target = bottomContentRef.current;
if (!container || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log('===> entry:', entry);
          if (entry.isIntersecting && hasMore && !isValidating) {
            loadMore();
          }
        });
      },
      {
        root: container,
        rootMargin: '0px 0px 0px 0px', // 하단에서 100px 이전에 trigger되도록 설정
        threshold: 1,
      },
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };

}, [loadMore, hasMore, isValidating]);

useImperativeHandle(ref, () => ({
refresh: async () => mutate(),
loadMore: loadMore,
setSize,
mutate,
}));

if (error) {
return <div>Error: {error.message}</div>;
}
const heightClass = `min-h-[${heightVh ?? 65}vh] h-[${heightVh ?? 70}vh] `;

return (

<Table
isHeaderSticky
aria-label="Trader table with infinite pagination"
baseRef={containerRef}
// scrollRef={containerRef}
isCompact
isStriped
layout="fixed"
border={undefined}
radius="none"
onSortChange={onSortChange}
sortDescriptor={sortDescriptor}
color="primary"
bottomContent={
hasMore ? (
<div ref={bottomContentRef} className="flex w-full justify-center">
<Spinner color="primary" />
</div>
) : null
}
classNames={{
        base: 'w-full overflow-y-auto',
        table: clsx(heightClass),
        wrapper: clsx(tableClassName, 'pt-0', heightClass),
        thead: 'py-2',
        th: 'text-center px-1 whitespace-pre-wrap break-all text-body-9 text-content3 py-1',
        sortIcon: 'hidden',
      }} >
<TableHeader columns={headerColumns}>
{(column) => (
<TableColumn
key={column.uid}
allowsSorting={column.sortable}
align="center"
width={column.width ?? 60}
className={column.className} >
{column.name}
</TableColumn>
)}
</TableHeader>
<TableBody
isLoading={!data && !error}
// isLoading={true}
items={items}
loadingContent={<InfiniteTableSkeleton />}
emptyContent={<div>데이터가 없습니다.</div>} >
{(item) => (
<TableRow key={(item as any).userKey}>
{(columnKey) => (
<TableCell>
{renderRow({
item,
columnKey,
value: getKeyValue(item, columnKey),
userKey: (item as any).userKey,
})}
</TableCell>
)}
</TableRow>
)}
</TableBody>
</Table>
);
}

const ForwardedListContainer = forwardRef(ListContainer) as <T>(
props: ListContainerTableProps<T> & { ref?: React.ForwardedRef<ListContainerHandle> },
) => ReactNode;

export default ForwardedListContainer;

// hooks/list.ts
import { createRef, useEffect } from 'react';
import useFetcher from '@/utils/hook/fetcher';
import { headerColumns } from '../constants';
import { usePromotionDirectStore } from '../store';
import { orderByConverter } from '@/utils/paging';
import ListContainer, { ListContainerHandle, ListResponse } from '@/components/table/infinite';
import { SortDescriptor } from '@react-types/shared';
import { getCurrentMonth, getNextMonth } from '@/utils/date';
import { CustomCell } from '../components/table/custom-cell';

type VO = DirectPromotionMng;
type VOResp = RespData<VO[]>;

interface IProps {
empNo: string;
}

export function useListPromotionDirect({ empNo }: IProps) {
const { fetcherJson } = useFetcher();
const store = usePromotionDirectStore();
const listContainerRef = createRef<ListContainerHandle>();
const currentMonth = getCurrentMonth();
const nextMonth = getNextMonth();

// getKey: 페이지 인덱스와 이전 페이지 데이터를 이용해 API key 생성 (page는 1부터 시작)
const getKey = (pageIndex: number, previousPageData: ListResponse<VO> | null) => {
if (previousPageData && previousPageData.data.length === 0) return null;
const page = pageIndex + 1;
// Get API body with page parameter but don't update state
const body = JSON.stringify({ ...store.getApiBody(page), empNo, page });
console.log('===> getKey:', body);
return `/api/promotion/direct/list|${body}`;
};

const fetcher = async (key: string): Promise<ListResponse<VO>> => {
const [url, bodyString] = key.split('|');
const body = JSON.parse(bodyString);
// Update the page state here, outside of the render phase
if (body.page) store.updatePage(body.page);
const json = await fetcherJson<VOResp>(url, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(body),
});
const result = {
data: json.data ?? [],
dataCnt: json.dataCnt,
};
return result;
};

useEffect(() => {
store.listRef = listContainerRef;
}, [store, listContainerRef]);

const handleSortChange = (descriptor: SortDescriptor) => {
const newOrder = orderByConverter.descriptorToOrderBy(descriptor);
store.addOrderBy(newOrder);
};
const sortDescriptor = orderByConverter.orderByToDescriptor(store.param.orderBy);

return {
ListContainerComponent: (
<ListContainer<VO>
ref={listContainerRef}
getKey={getKey}
fetcher={fetcher}
headerColumns={headerColumns({ currentMonth, nextMonth })}
renderRow={(p) => <CustomCell {...p} />}
initialSize={1}
tableClassName="w-full"
onSortChange={handleSortChange}
sortDescriptor={sortDescriptor}
onChangePage={(page) => store.updatePage(page)}
onChangeLoading={(loading) => store.setLoading(loading)}
/>
),
headerColumns,
};
}
