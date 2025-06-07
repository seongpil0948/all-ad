# Meta 광고 플랫폼 통합 가이드: 올애드를 위한 실무 전략

Meta 광고 플랫폼(Facebook/Instagram Business)을 통합하려면 **System User 기반의 서버 사이드 아키텍처**를 구축하고, Marketing API v23.0을 활용하여 안정적인 광고 관리 시스템을 구현해야 합니다. 본 가이드는 2025년 6월 기준 최신 정보를 바탕으로 올애드 플랫폼에서 Meta 광고를 효과적으로 통합하기 위한 모든 기술적, 규제적 요구사항을 다룹니다. 특히 한국 시장의 개인정보보호법(PIPA) 준수와 iOS 14+ 환경에서의 추적 정확도 향상에 중점을 두었습니다.

## Meta 광고 플랫폼의 진화와 현재 구조

Meta Business Suite는 2024년을 기점으로 Facebook Business Manager의 기능을 대부분 흡수하며 통합 광고 관리의 중심이 되었습니다. **Business Manager는 이제 Meta Business Portfolio**로 명칭이 변경되었으며, 비즈니스 자산 관리와 권한 설정을 담당합니다. 광고 계정은 Business Portfolio → Ad Account → Campaign → Ad Set → Ad의 계층 구조를 따르며, 각 레벨에서 다른 설정과 최적화가 가능합니다.

2025년 1월 출시된 Marketing API v23.0은 **Advantage+ Creative Standard Enhancements의 개별 기능화**와 **위치 기반 타겟팅 개선**으로 6.7% 비용 절감 효과를 제공합니다. 하지만 주택과 금융 서비스 캠페인에는 새로운 규제가 적용되어 커스텀 오디언스 사용이 제한됩니다. API는 2년간 지원되며, 현재 v19.0은 2025년 2월, v20.0은 5월에 지원이 종료될 예정입니다.

## 안정적인 인증 체계 구축하기

올애드와 같은 광고 통합 플랫폼에서는 **System User Access Token**을 사용하는 것이 필수입니다. 일반 사용자 토큰은 최대 60일의 유효기간을 가지지만, System User Token은 무기한 유효하여 서비스 안정성을 보장합니다. OAuth 2.0 Authorization Code Flow를 통해 초기 인증을 진행한 후, Business Portfolio에서 System User를 생성하고 필요한 권한(`ads_management`, `ads_read`, `business_management`)을 부여합니다.

Facebook Login for Business는 `config_id` 기반의 강화된 보안을 제공하며, 비즈니스 계정 관리에 최적화되어 있습니다. **App Review 프로세스**는 Advanced Access 권한 획득을 위해 필수이며, 비즈니스 인증과 함께 7-14일의 심사 기간이 소요됩니다. 심사 시 명확한 사용 사례 설명과 완성도 높은 데모 영상이 승인률을 높이는 핵심입니다.

## API 활용 전략과 구현 방법

Marketing API는 Graph API의 하위 집합으로 광고 관련 기능에 특화되어 있습니다. **Conversions API**는 iOS 14.5+ 개인정보 보호 정책과 광고 차단기를 우회하여 서버 측에서 직접 전환 데이터를 전송합니다. Meta는 Facebook Pixel과 Conversions API의 이중 추적(Dual Tracking)을 권장하며, Event ID를 통한 중복 제거로 정확한 데이터 집계를 보장합니다.

```javascript
// Node.js SDK를 활용한 캠페인 생성 예제
const adsSdk = require("facebook-nodejs-business-sdk");
const { AdAccount, Campaign } = adsSdk;

const createCampaign = async (adAccountId, campaignData) => {
  const account = new AdAccount(`act_${adAccountId}`);

  const campaign = await account.createCampaign(
    [Campaign.Fields.id, Campaign.Fields.name],
    {
      [Campaign.Fields.name]: campaignData.name,
      [Campaign.Fields.objective]: Campaign.Objective.conversions,
      [Campaign.Fields.status]: Campaign.Status.paused,
      [Campaign.Fields.daily_budget]: campaignData.dailyBudget * 100,
    },
  );

  return campaign;
};
```

**Rate Limiting 정책**은 시간당 200회 기본 호출에 활성 광고당 5회를 추가로 허용합니다. 응답 헤더의 `X-App-Usage`를 모니터링하여 25% 미만을 유지하고, 75% 이상일 경우 지수 백오프 전략을 적용해야 합니다. Batch API를 활용하면 최대 50개의 요청을 한 번에 처리할 수 있어 네트워크 오버헤드를 줄일 수 있습니다.

## 개인정보 보호 규정 준수의 중요성

2024년 Meta는 한국에서 **약 98만명의 민감정보를 무단 수집**하여 21.6억원의 과징금을 부과받았습니다. 이는 종교, 정치적 견해 등의 민감정보를 별도 동의 없이 광고 타겟팅에 활용했기 때문입니다. 올애드 플랫폼은 한국 개인정보보호법(PIPA)의 민감정보 처리 금지 원칙을 엄격히 준수해야 하며, 수집 목적 달성 시 즉시 데이터를 삭제하는 시스템을 구축해야 합니다.

GDPR 준수를 위해서는 **명시적 동의 획득**과 **데이터 최소화 원칙**을 따라야 합니다. 유럽 법원(CJEU)은 광고 타겟팅용 개인데이터에 명확한 보존 기간 설정을 요구하고 있으며, Meta는 이미 EU에서 12억 유로의 과징금을 부과받은 바 있습니다. Consent Management Platform(CMP)을 도입하여 동의 관리를 자동화하고, 사용자가 언제든 동의를 철회할 수 있는 시스템을 구축하는 것이 필수입니다.

## 성능 최적화와 모니터링 전략

광고 성과 추적의 정확도를 높이기 위해 **Conversions API와 Facebook Pixel의 이중 추적**을 구현해야 합니다. 서버 사이드 이벤트 추적은 브라우저 제약을 받지 않아 iOS 환경에서도 안정적인 데이터 수집이 가능합니다. Event Match Quality 점수를 정기적으로 모니터링하여 데이터 품질을 관리하고, 중복 이벤트는 동일한 Event ID를 사용하여 자동으로 제거됩니다.

Insights API를 통한 성과 데이터 조회 시에는 필요한 필드만 선택적으로 요청하여 API 호출을 최적화해야 합니다. 대량의 데이터 처리가 필요한 경우 비동기 리포트 생성 기능을 활용하고, 자주 변경되지 않는 데이터는 최대 24시간까지 캐싱이 가능합니다. 실시간 업데이트가 필요한 Lead Ads의 경우 Webhook을 설정하여 즉시 CRM과 연동할 수 있습니다.

# Facebook Business SDK for NodeJS

[![npm](https://img.shields.io/npm/v/facebook-nodejs-business-sdk)](https://www.npmjs.com/package/facebook-nodejs-business-sdk)
[![License](https://img.shields.io/badge/license-Facebook%20Platform-blue.svg?style=flat-square)](https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/facebook/facebook-nodejs-business-sdk/ci.yml)](https://github.com/facebook/facebook-nodejs-business-sdk/actions/workflows/ci.yml)

### Introduction

The Facebook <a href="https://developers.facebook.com/docs/business-sdk" target="_blank">Business SDK</a> is a one-stop shop to help our partners better serve their businesses. Partners are using multiple Facebook API's to serve the needs of their clients. Adopting all these API's and keeping them up to date across the various platforms can be time consuming and ultimately prohibitive. For this reason Facebook has developed the Business SDK bundling many of its APIs into one SDK to ease implementation and upkeep. The Business SDK is an upgraded version of the Marketing API SDK that includes the Marketing API as well as many Facebook APIs from different platforms such as Pages, Business Manager, Instagram, etc.

This SDK can be used for both server side as well as client side. It comes with ECMAScript 5 bundled minified distribution with source maps of AMD, CommonJS modules, IIFE, as UMD and as Browser Globals.

## Quick Start

Business SDK <a href="https://developers.facebook.com/docs/business-sdk/getting-started" target="_blank">Getting Started Guide</a>

## Pre-requisites

### Dependencies

[Gulp](http://gulpjs.com/) and [Bower](http://bower.io/) should be installed globally. Install dependencies:

```bash
npm install
bower install
```

Checkout `gulpfile.js` for all available tasks.

### Register An App

To get started with the SDK, you must have an app
registered on <a href="https://developers.facebook.com/" target="_blank">developers.facebook.com</a>.

To manage the Marketing API, please visit your
<a href="https://developers.facebook.com/apps/<YOUR APP ID>/dashboard"> App Dashboard </a>
and add the <b>Marketing API</b> product to your app.

**IMPORTANT**: For security, it is recommended that you turn on 'App Secret
Proof for Server API calls' in your app's Settings->Advanced page.

### Obtain An Access Token

When someone connects with an app using Facebook Login and approves the request
for permissions, the app obtains an access token that provides temporary, secure
access to Facebook APIs.

An access token is an opaque string that identifies a User, app, or Page.

For example, to access the Marketing API, you need to generate a User access token
for your app and ask for the `ads_management` permission; to access Pages API,
you need to generate a Page access token for your app and ask for the `manage_page` permission.

Refer to our
<a href="https://developers.facebook.com/docs/facebook-login/access-tokens" target="_blank">
Access Token Guide</a> to learn more.

For now, we can use the
<a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph Explorer</a>
to get an access token.

## Installation

NPM

`npm install --save facebook-nodejs-business-sdk`

Bower

`bower install --save facebook-nodejs-business-sdk`

## Usage

### Access Token

When someone connects with an app using Facebook Login and approves the request for permissions, the app obtains an access token that provides temporary, secure access to Facebook APIs.

An access token is an opaque string that identifies a User, app, or Page.

For example, to access the Marketing API, you need to generate a User access token for your app and ask for the `ads_management` permission; to access Pages API, you need to generate a Page access token for your app and ask for the `manage_page` permission.
Refer to our <a href="https://developers.facebook.com/docs/facebook-login/access-tokens" target="_blank">Access Token Guide</a> to learn more.

For now, we can use the <a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph Explorer</a> to get an access token.

```javaScript
const adsSdk = require('facebook-nodejs-business-sdk');
const accessToken = '<VALID_ACCESS_TOKEN>';
const api = adsSdk.FacebookAdsApi.init(accessToken);
```

### Api main class

The `FacebookAdsApi` object is the foundation of the Business SDK which encapsulates the logic to execute requests against the Graph API.
Once instantiated, the Api object will allow you to start making requests to the Graph API.

### Facebook Objects

Facebook Ads entities are defined as classes under the `src/objects` directory.

```javascript
// instantiating an object
const adsSdk = require("facebook-nodejs-business-sdk");
const AdAccount = adsSdk.AdAccount;
const account = new AdAccount("act_<AD_ACCOUNT_ID>");
console.log(account.id); // fields can be accessed as properties
```

### Fields

Due to the high number of field names in the existing API objects, in order to facilitate your code maintainability, enum-like field objects are provided within each node class.
The fields are stored within node object classes which are stored under the `src/objects` directory.
You can access object properties like this:

```javaScript
const adsSdk = require('facebook-nodejs-business-sdk');
const accessToken = '<VALID_ACCESS_TOKEN>';
const api = adsSdk.FacebookAdsApi.init(accessToken);
const AdAccount = adsSdk.AdAccount;
const Campaign = adsSdk.Campaign;
const account = new AdAccount('act_<AD_ACCOUNT_ID>');

console.log(account.id) // fields can be accessed as properties
account
  .createCampaign(
    [Campaign.Fields.Id],
    {
      [Campaign.Fields.name]: 'Page likes campaign', // Each object contains a fields map with a list of fields supported on that object.
      [Campaign.Fields.status]: Campaign.Status.paused,
      [Campaign.Fields.objective]: Campaign.Objective.page_likes
    }
  )
  .then((result) => {
  })
  .catch((error) => {
  });
```

#### Read Objects

```javascript
const adsSdk = require("facebook-nodejs-business-sdk");
const accessToken = "<VALID_ACCESS_TOKEN>";
const api = adsSdk.FacebookAdsApi.init(accessToken);
const AdAccount = adsSdk.AdAccount;
const account = new AdAccount("act_<AD_ACCOUNT_ID>");
account
  .read([AdAccount.Fields.name, AdAccount.Fields.age])
  .then((account) => {
    console.log(account);
  })
  .catch((error) => {});
```

Requesting an high number of fields may cause the response time to visibly increase, you should always request only the fields you really need.

#### Create Objects

```javascript
const adsSdk = require("facebook-nodejs-business-sdk");
const accessToken = "<VALID_ACCESS_TOKEN>";
const api = adsSdk.FacebookAdsApi.init(accessToken);
const AdAccount = adsSdk.AdAccount;
const Campaign = adsSdk.Campaign;
const account = new AdAccount("act_<AD_ACCOUNT_ID>");
account
  .createCampaign([], {
    [Campaign.Fields.name]: "Page likes campaign",
    [Campaign.Fields.status]: Campaign.Status.paused,
    [Campaign.Fields.objective]: Campaign.Objective.page_likes,
  })
  .then((campaign) => {})
  .catch((error) => {});
```

#### Update Objects

```javascript
const adsSdk = require('facebook-nodejs-business-sdk');
const accessToken = '<VALID_ACCESS_TOKEN>';
const api = adsSdk.FacebookAdsApi.init(accessToken);
const Campaign = adsSdk.Campaign;
const campaignId = <CAMPAIGN_ID>;
new Campaign(campaignId, {
  [Campaign.Fields.id]: campaign.id,
  [Campaign.Fields.name]: 'Campaign - Updated' })
  .update();
```

#### Delete Objects

```javascript
const adsSdk = require('facebook-nodejs-business-sdk');
const accessToken = '<VALID_ACCESS_TOKEN>';
const api = adsSdk.FacebookAdsApi.init(accessToken);
const Campaign = adsSdk.Campaign;
const campaignId = <CAMPAIGN_ID>;
new Campaign(campaignId).delete();
```

### Pagination

Since the release of the Facebook Graph API 2.0, pagination is handled through <a href="https://developers.facebook.com/docs/graph-api/using-graph-api/v2.2#paging" target="_blank">cursors</a>.

Here cursors are defined as in `src\cursor.js`. When fetching nodes related to another (Edges) or a collection in the graph, the results are paginated in a `Cursor` class.
Here the `Cursor` is a superpowered `Array` (with all it's native helpful operations) with `next` and `previous` methods that when resolved fills itself with the new set of objects.

```javascript
const adsSdk = require("facebook-nodejs-business-sdk");
const accessToken = "<VALID_ACCESS_TOKEN>";
const api = adsSdk.FacebookAdsApi.init(accessToken);
const AdAccount = adsSdk.AdAccount;
const Campaign = adsSdk.Campaign;
const account = new AdAccount("act_<AD_ACCOUNT_ID>");
account
  .getCampaigns([Campaign.Fields.name], { limit: 2 })
  .then((campaigns) => {
    if (campaigns.length >= 2 && campaigns.hasNext()) {
      return campaigns.next();
    } else {
      Promise.reject(new Error("campaigns length < 2 or not enough campaigns"));
    }
  })
  .then((campaigns) => {
    if (campaigns.hasNext() && campaigns.hasPrevious()) {
      return campaigns.previous();
    } else {
      Promise.reject(new Error("previous or next is not true"));
    }
    return campaigns.previous();
  })
  .catch((error) => {});
```

If you are using cursor to iterate all of your object under your Ad Account, this practice is recommended.

```javascript
const adsSdk = require("facebook-nodejs-ads-sdk");
const accessToken = "<VALID_ACCESS_TOKEN>";
const api = adsSdk.FacebookAdsApi.init(accessToken);
const AdAccount = adsSdk.AdAccount;
const account = new AdAccount("act_<AD_ACCOUNT_ID>");

void (async function () {
  let campaigns = await account.getCampaigns([Campaign.Fields.name], {
    limit: 20,
  });
  campaigns.forEach((c) => console.log(c.name));
  while (campaigns.hasNext()) {
    campaigns = await campaigns.next();
    campaigns.forEach((c) => console.log(c.name));
  }
})();
```

#### Debugging

A `FacebookAdsApi` object offers a debugging mode that will log all requests. To enable it just call `api.setDebug(true)` on an API instance.

```javascript
const adsSdk = require("facebook-nodejs-business-sdk");
const accessToken = "<VALID_ACCESS_TOKEN>";
const api = adsSdk.FacebookAdsApi.init(accessToken);
api.setDebug(true);
```

### Style

This package uses type safe javascript. <a href="https://flow.org/" target="_blank">Flow</a>. Inconsistent code will break builds.

## SDK Codegen

Our SDK is autogenerated from [SDK Codegen](https://github.com/facebook/facebook-business-sdk-codegen). If you want to learn more about how our SDK code is generated, please check this repository.

## Join the Facebook Marketing Developer community

- Website: https://www.facebook.com/groups/pmdcommunity
- Facebook page: https://www.facebook.com/marketingdevelopers/
  See the CONTRIBUTING file for how to help out.

## License

Facebook Business SDK for NodeJS is licensed under the LICENSE file in the root directory of this source tree.
