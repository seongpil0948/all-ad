// Google Ads API specific response types

// Customer related types
export interface GoogleAdsCustomer {
  id: string;
  descriptive_name?: string;
  currency_code?: string;
  time_zone?: string;
  test_account?: boolean;
  manager?: boolean;
  auto_tagging_enabled?: boolean;
  tracking_url_template?: string;
  resource_name?: string;
  can_manage_clients?: boolean;
  status?:
    | "UNSPECIFIED"
    | "UNKNOWN"
    | "ENABLED"
    | "CANCELED"
    | "SUSPENDED"
    | "CLOSED";
  optimization_score?: number;
  has_partners_badge?: boolean;
  call_reporting_setting?: {
    call_reporting_enabled?: boolean;
    call_conversion_reporting_enabled?: boolean;
    call_conversion_action?: string;
  };
}

// Customer Client Link types
export interface CustomerClientLink {
  resource_name?: string;
  client_customer?: string;
  manager_link_id?: string;
  status?:
    | "UNSPECIFIED"
    | "UNKNOWN"
    | "ACTIVE"
    | "INACTIVE"
    | "PENDING"
    | "REFUSED"
    | "CANCELED";
  hidden?: boolean;
}

// Customer Client types
export interface CustomerClient {
  id: string;
  descriptive_name?: string;
  currency_code?: string;
  time_zone?: string;
  test_account?: boolean;
  manager?: boolean;
  resource_name?: string;
  status?:
    | "UNSPECIFIED"
    | "UNKNOWN"
    | "ENABLED"
    | "CANCELED"
    | "SUSPENDED"
    | "CLOSED";
  level?: string;
  applied_labels?: string[];
  hidden?: boolean;
  client_customer?: string;
}

// Campaign types
export interface GoogleAdsCampaignResource {
  id: string;
  name: string;
  status: "UNSPECIFIED" | "UNKNOWN" | "ENABLED" | "PAUSED" | "REMOVED";
  serving_status?: string;
  ad_serving_optimization_status?: string;
  advertising_channel_type?: string;
  advertising_channel_sub_type?: string;
  campaign_budget?: string;
  bidding_strategy_type?: string;
  start_date?: string;
  end_date?: string;
  network_settings?: {
    target_google_search?: boolean;
    target_search_network?: boolean;
    target_content_network?: boolean;
    target_partner_search_network?: boolean;
  };
  resource_name?: string;
}

// Campaign Budget types
export interface CampaignBudget {
  id?: string;
  name?: string;
  amount_micros?: string;
  total_amount_micros?: string;
  explicitly_shared?: boolean;
  reference_count?: string;
  has_recommended_budget?: boolean;
  recommended_budget_amount_micros?: string;
  period?: "UNSPECIFIED" | "UNKNOWN" | "DAILY" | "CUSTOM_PERIOD";
  delivery_method?: "UNSPECIFIED" | "UNKNOWN" | "STANDARD" | "ACCELERATED";
  resource_name?: string;
}

// Metrics types
export interface GoogleAdsMetricsResource {
  impressions?: string;
  clicks?: string;
  cost_micros?: string;
  conversions?: string;
  conversions_value?: string;
  all_conversions?: string;
  all_conversions_value?: string;
  view_through_conversions?: string;
  ctr?: string;
  average_cpc?: string;
  average_cpm?: string;
  average_cpv?: string;
  average_cpe?: string;
  bounce_rate?: string;
  conversion_rate?: string;
  cost_per_conversion?: string;
  cost_per_all_conversions?: string;
  engagement_rate?: string;
  interaction_rate?: string;
}

// Segments types
export interface GoogleAdsSegments {
  date?: string;
  day_of_week?: string;
  device?: string;
  hour?: string;
  month?: string;
  quarter?: string;
  week?: string;
  year?: string;
}

// Label types
export interface GoogleAdsLabelResource {
  id?: string;
  name?: string;
  status?: "UNSPECIFIED" | "UNKNOWN" | "ENABLED" | "REMOVED";
  description?: string;
  background_color?: {
    red?: number;
    green?: number;
    blue?: number;
  };
  resource_name?: string;
}

// Campaign Label types
export interface CampaignLabel {
  resource_name?: string;
  campaign?: string;
  label?: string;
}

// Query Response Row types
export interface GoogleAdsQueryResponseRow {
  customer?: GoogleAdsCustomer;
  customer_client_link?: CustomerClientLink;
  customer_client?: CustomerClient;
  campaign?: GoogleAdsCampaignResource;
  campaign_budget?: CampaignBudget;
  metrics?: GoogleAdsMetricsResource;
  segments?: GoogleAdsSegments;
  label?: GoogleAdsLabelResource;
  campaign_label?: CampaignLabel;
}

// Mutation Response types
export interface MutateResourceResponse {
  results?: Array<{
    resource_name?: string;
    campaign?: {
      resource_name?: string;
    };
    label?: {
      resource_name?: string;
    };
    campaign_label?: {
      resource_name?: string;
    };
  }>;
  partial_failure_error?: unknown;
}

// Account info for lab testing
export interface GoogleAdsAccountInfo {
  id: string;
  name: string;
  currencyCode?: string;
  timeZone?: string;
  isManager: boolean;
  isTestAccount: boolean;
  isMCC?: boolean;
  status?: string;
  isHidden?: boolean;
  level?: number;
  linkStatus?: string;
  resourceName?: string;
  canManageClients?: boolean;
  optimizationScore?: number;
  hasPartnersBadge?: boolean;
  callReportingEnabled?: boolean;
}

// OAuth token response
export interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  error?: string;
  error_description?: string;
}
