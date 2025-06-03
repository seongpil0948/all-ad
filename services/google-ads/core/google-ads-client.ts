import { GoogleAdsApi, Customer } from "google-ads-api";

import { GoogleAdsApiCredentials } from "@/types/google-ads.types";
import { Logger } from "@/utils/logger";

// Google Ads API 클라이언트 래퍼
export class GoogleAdsClient {
  private client: GoogleAdsApi;
  private customer: Customer | null = null;

  constructor(private credentials: GoogleAdsApiCredentials) {
    this.client = new GoogleAdsApi({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      developer_token: credentials.developerToken,
    });
  }

  // 인증된 고객 클라이언트 가져오기
  async getAuthenticatedCustomer(customerId: string): Promise<Customer> {
    if (
      !this.customer ||
      this.customer.credentials.customer_id !== customerId
    ) {
      this.customer = this.client.Customer({
        customer_id: customerId,
        refresh_token: this.credentials.refreshToken,
        login_customer_id: this.credentials.loginCustomerId,
      });
    }

    return this.customer;
  }

  // Google Ads Query Language (GAQL) 실행
  async query<T = any>(customerId: string, query: string): Promise<T[]> {
    try {
      const customer = await this.getAuthenticatedCustomer(customerId);
      const results = await customer.query(query);

      Logger.info("Google Ads 쿼리 실행 성공", {
        customerId,
        resultCount: results.length,
      });

      return results as T[];
    } catch (error) {
      Logger.error("Google Ads 쿼리 실행 실패", error as Error, {
        customerId,
        query,
      });
      throw error;
    }
  }

  // 변경 작업 실행 (mutate)
  async mutate(
    customerId: string,
    operations: any[],
    options?: { validate_only?: boolean; partial_failure?: boolean },
  ): Promise<any> {
    try {
      const customer = await this.getAuthenticatedCustomer(customerId);
      const response = await customer.mutateResources(operations, options);

      Logger.info("Google Ads 변경 작업 성공", {
        customerId,
        operationCount: operations.length,
      });

      return response;
    } catch (error) {
      Logger.error("Google Ads 변경 작업 실패", error as Error, {
        customerId,
        operationCount: operations.length,
      });
      throw error;
    }
  }

  // 리포트 실행 (스트리밍)
  async report(
    customerId: string,
    query: string,
  ): Promise<AsyncIterableIterator<any>> {
    try {
      const customer = await this.getAuthenticatedCustomer(customerId);
      // reportStream은 query가 아닌 다른 형식을 받을 수 있음
      // 직접 쿼리를 실행하고 스트림으로 변환
      const results = await customer.query(query);

      // AsyncIterableIterator로 변환
      async function* resultIterator() {
        for (const result of results) {
          yield result;
        }
      }

      Logger.info("Google Ads 리포트 스트림 시작", { customerId });

      return resultIterator();
    } catch (error) {
      Logger.error("Google Ads 리포트 실행 실패", error as Error, {
        customerId,
        query,
      });
      throw error;
    }
  }

  // 계정 정보 조회
  async getAccountInfo(customerId: string): Promise<any> {
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager
      FROM customer
      WHERE customer.id = ${customerId}
    `;

    const results = await this.query(customerId, query);

    return results[0] || null;
  }

  // 하위 계정 목록 조회 (MCC)
  async getAccessibleCustomers(): Promise<string[]> {
    try {
      const customer = this.client.Customer({
        customer_id: this.credentials.loginCustomerId || "",
        refresh_token: this.credentials.refreshToken,
      });

      // listAccessibleCustomers는 google-ads-api의 Customer 메서드가 아닐 수 있음
      // 대신 쿼리를 사용하여 하위 계정 조회
      const query = `
        SELECT
          customer_client.id,
          customer_client.descriptive_name,
          customer_client.level,
          customer_client.manager,
          customer_client.resource_name
        FROM customer_client
        WHERE customer_client.level <= 1
      `;

      const results = await customer.query(query);
      const accessibleCustomers = results
        .map(
          (result: any) =>
            result.customer_client?.id || result.customer_client?.resource_name,
        )
        .filter(Boolean);

      Logger.info("접근 가능한 고객 목록 조회 성공", {
        count: accessibleCustomers.length,
      });

      return accessibleCustomers;
    } catch (error) {
      Logger.error("접근 가능한 고객 목록 조회 실패", error as Error);
      throw error;
    }
  }
}
