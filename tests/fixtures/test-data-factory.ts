import { faker } from "@faker-js/faker";
import type { Database } from "@/types/supabase.types";

type Tables = Database["public"]["Tables"];

/**
 * Test Data Factory
 * Provides consistent test data generation for all test types
 */
export class TestDataFactory {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
    faker.seed(this.seed);
  }

  /**
   * Generate a test user
   */
  generateUser(
    overrides?: Partial<Tables["profiles"]["Row"]>,
  ): Tables["profiles"]["Row"] {
    const userId = faker.string.uuid();
    return {
      id: userId,
      email: faker.internet.email().toLowerCase(),
      full_name: faker.person.fullName(),
      avatar_url: faker.image.avatar(),
      created_at: faker.date.past().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate a test team
   */
  generateTeam(
    masterUserId: string,
    overrides?: Partial<Tables["teams"]["Row"]>,
  ): Tables["teams"]["Row"] {
    const teamId = faker.string.uuid();
    return {
      id: teamId,
      name: faker.company.name(),
      master_user_id: masterUserId,
      created_at: faker.date.past().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate a test campaign
   */
  generateCampaign(
    teamId: string,
    overrides?: Partial<Tables["campaigns"]["Row"]>,
  ): Tables["campaigns"]["Row"] {
    const campaignId = faker.string.uuid();
    const platforms = [
      "google",
      "facebook",
      "naver",
      "kakao",
      "coupang",
      "amazon",
      "tiktok",
    ] as const;
    const statuses = ["active", "paused", "ended"];

    return {
      id: campaignId,
      team_id: teamId,
      platform: faker.helpers.arrayElement(platforms),
      platform_campaign_id: faker.string.alphanumeric(10),
      name: faker.commerce.productName() + " Campaign",
      status: faker.helpers.arrayElement(statuses),
      budget: faker.number.int({ min: 100, max: 10000 }),
      is_active: faker.datatype.boolean(),
      platform_credential_id: faker.string.uuid(),
      synced_at: faker.date.recent().toISOString(),
      created_at: faker.date.past().toISOString(),
      updated_at: new Date().toISOString(),
      raw_data: {},
      ...overrides,
    };
  }

  /**
   * Generate campaign metrics
   */
  generateCampaignMetrics(
    campaignId: string,
    date?: Date,
    overrides?: Partial<Tables["campaign_metrics"]["Row"]>,
  ): Tables["campaign_metrics"]["Row"] {
    const metricsDate = date || faker.date.recent();
    const impressions = faker.number.int({ min: 100, max: 100000 });
    const clicks = faker.number.int({ min: 0, max: impressions * 0.1 });
    const cost = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
    const conversions = faker.number.int({ min: 0, max: clicks * 0.2 });

    return {
      id: faker.string.uuid(),
      campaign_id: campaignId,
      date: metricsDate.toISOString().split("T")[0],
      impressions,
      clicks,
      cost,
      conversions,
      revenue:
        conversions *
        faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      raw_data: {},
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate platform credentials
   */
  generatePlatformCredentials(
    teamId: string,
    platform: Database["public"]["Enums"]["platform_type"],
    overrides?: Partial<Tables["platform_credentials"]["Row"]>,
  ): Tables["platform_credentials"]["Row"] {
    return {
      id: faker.string.uuid(),
      team_id: teamId,
      platform,
      account_id: faker.string.alphanumeric(12),
      account_name: faker.company.name() + " Ad Account",
      access_token: faker.string.alphanumeric(64),
      refresh_token: faker.string.alphanumeric(64),
      expires_at: faker.date.future().toISOString(),
      scope: "ads_read ads_management",
      is_active: true,
      created_by: faker.string.uuid(),
      credentials: {},
      data: {},
      error_message: null,
      last_synced_at: faker.date.recent().toISOString(),
      created_at: faker.date.past().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Generate team member
   */
  generateTeamMember(
    teamId: string,
    userId: string,
    overrides?: Partial<Tables["team_members"]["Row"]>,
  ): Tables["team_members"]["Row"] {
    const roles = ["master", "team_mate", "viewer"] as const;

    return {
      id: faker.string.uuid(),
      team_id: teamId,
      user_id: userId,
      role: faker.helpers.arrayElement(roles),
      joined_at: faker.date.past().toISOString(),
      invited_by: faker.string.uuid(),
      ...overrides,
    };
  }

  /**
   * Generate bulk test data
   */
  generateBulkData(config: {
    users?: number;
    teams?: number;
    campaignsPerTeam?: number;
    metricsPerCampaign?: number;
  }) {
    const {
      users = 5,
      teams = 3,
      campaignsPerTeam = 10,
      metricsPerCampaign = 30,
    } = config;

    const data = {
      users: [] as Tables["profiles"]["Row"][],
      teams: [] as Tables["teams"]["Row"][],
      campaigns: [] as Tables["campaigns"]["Row"][],
      metrics: [] as Tables["campaign_metrics"]["Row"][],
      teamMembers: [] as Tables["team_members"]["Row"][],
    };

    // Generate users
    for (let i = 0; i < users; i++) {
      data.users.push(this.generateUser());
    }

    // Generate teams
    for (let i = 0; i < teams; i++) {
      const masterUserId = data.users[i % data.users.length].id;
      const team = this.generateTeam(masterUserId);
      data.teams.push(team);

      // Assign users to teams
      data.users.forEach((user, index) => {
        if (index % teams === i) {
          data.teamMembers.push(
            this.generateTeamMember(team.id, user.id, {
              role: index === 0 ? "master" : "team_mate",
            }),
          );
        }
      });

      // Generate campaigns for each team
      for (let j = 0; j < campaignsPerTeam; j++) {
        const campaign = this.generateCampaign(team.id);
        data.campaigns.push(campaign);

        // Generate metrics for each campaign
        for (let k = 0; k < metricsPerCampaign; k++) {
          const date = new Date();
          date.setDate(date.getDate() - k);
          data.metrics.push(this.generateCampaignMetrics(campaign.id, date));
        }
      }
    }

    return data;
  }

  /**
   * Generate mock API responses
   */
  generateMockApiResponse(platform: string, endpoint: string) {
    switch (platform) {
      case "google":
        return this.generateGoogleAdsResponse(endpoint);
      case "facebook":
        return this.generateFacebookAdsResponse(endpoint);
      case "naver":
        return this.generateNaverAdsResponse(endpoint);
      case "kakao":
        return this.generateKakaoAdsResponse(endpoint);
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }
  }

  private generateGoogleAdsResponse(endpoint: string) {
    if (endpoint === "campaigns") {
      return {
        campaigns: Array.from(
          { length: faker.number.int({ min: 1, max: 10 }) },
          () => ({
            id: faker.string.numeric(10),
            name: faker.commerce.productName() + " Campaign",
            status: faker.helpers.arrayElement([
              "ENABLED",
              "PAUSED",
              "REMOVED",
            ]),
            campaign_budget: {
              amount_micros: faker.number.int({ min: 1000000, max: 100000000 }),
            },
          }),
        ),
      };
    }

    if (endpoint === "metrics") {
      return {
        metrics: {
          impressions: faker.number.int({ min: 1000, max: 100000 }),
          clicks: faker.number.int({ min: 10, max: 1000 }),
          cost_micros: faker.number.int({ min: 1000000, max: 10000000 }),
          conversions: faker.number.int({ min: 0, max: 100 }),
          ctr: faker.number.float({ min: 0.01, max: 0.1, fractionDigits: 4 }),
          average_cpc: faker.number.float({
            min: 0.1,
            max: 10,
            fractionDigits: 2,
          }),
        },
      };
    }

    return {};
  }

  private generateFacebookAdsResponse(endpoint: string) {
    if (endpoint === "campaigns") {
      return {
        data: Array.from(
          { length: faker.number.int({ min: 1, max: 10 }) },
          () => ({
            id: faker.string.numeric(15),
            name: faker.commerce.productName() + " Campaign",
            status: faker.helpers.arrayElement(["ACTIVE", "PAUSED", "DELETED"]),
            daily_budget: faker.number.int({ min: 1000, max: 100000 }),
            lifetime_budget: null,
          }),
        ),
        paging: {
          cursors: {
            before: faker.string.alphanumeric(20),
            after: faker.string.alphanumeric(20),
          },
        },
      };
    }

    if (endpoint === "insights") {
      return {
        data: [
          {
            impressions: faker.number
              .int({ min: 1000, max: 100000 })
              .toString(),
            clicks: faker.number.int({ min: 10, max: 1000 }).toString(),
            spend: faker.number
              .float({ min: 10, max: 1000, fractionDigits: 2 })
              .toString(),
            conversions: faker.number.int({ min: 0, max: 100 }).toString(),
            ctr: faker.number
              .float({ min: 0.5, max: 10, fractionDigits: 2 })
              .toString(),
            cpc: faker.number
              .float({ min: 0.1, max: 10, fractionDigits: 2 })
              .toString(),
          },
        ],
      };
    }

    return {};
  }

  private generateNaverAdsResponse(endpoint: string) {
    if (endpoint === "campaigns") {
      return Array.from(
        { length: faker.number.int({ min: 1, max: 10 }) },
        () => ({
          nccCampaignId: "cmp-" + faker.string.alphanumeric(10),
          name: faker.commerce.productName() + " 캠페인",
          campaignTp: faker.helpers.arrayElement(["WEB_SITE", "SHOPPING"]),
          status: faker.helpers.arrayElement(["ELIGIBLE", "PAUSED", "DELETED"]),
          dailyBudget: faker.number.int({ min: 10000, max: 1000000 }),
        }),
      );
    }

    if (endpoint === "stats") {
      return {
        impCnt: faker.number.int({ min: 1000, max: 100000 }),
        clkCnt: faker.number.int({ min: 10, max: 1000 }),
        salesAmt: faker.number.int({ min: 10000, max: 1000000 }),
        ccnt: faker.number.int({ min: 0, max: 100 }),
      };
    }

    return {};
  }

  private generateKakaoAdsResponse(endpoint: string) {
    if (endpoint === "campaigns") {
      return Array.from(
        { length: faker.number.int({ min: 1, max: 10 }) },
        () => ({
          id: faker.number.int({ min: 100000, max: 999999 }),
          name: faker.commerce.productName() + " 캠페인",
          status: faker.helpers.arrayElement(["ON", "OFF", "DELETED"]),
          dailyBudgetAmount: faker.number.int({ min: 10000, max: 1000000 }),
        }),
      );
    }

    if (endpoint === "report") {
      return {
        data: [
          {
            dimensions: {
              campaign_id: faker.number.int({ min: 100000, max: 999999 }),
            },
            metrics: {
              imp: faker.number.int({ min: 1000, max: 100000 }),
              click: faker.number.int({ min: 10, max: 1000 }),
              cost: faker.number.int({ min: 10000, max: 1000000 }),
              conv: faker.number.int({ min: 0, max: 100 }),
            },
          },
        ],
      };
    }

    return {};
  }

  /**
   * Reset factory with new seed
   */
  reset(seed?: number) {
    this.seed = seed || Date.now();
    faker.seed(this.seed);
  }
}

// Export singleton instance for consistent data across tests
export const testDataFactory = new TestDataFactory();

// Export faker for direct use when needed
export { faker };
