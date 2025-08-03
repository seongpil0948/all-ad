import { PlatformType } from "@/types";

// 플랫폼 공통 에러 클래스
export abstract class BasePlatformError extends Error {
  abstract readonly platform: PlatformType;
  abstract readonly code: string;
  abstract readonly userMessage: string;
  abstract readonly retryable: boolean;

  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 구체적인 PlatformError 클래스
export class PlatformError extends BasePlatformError {
  constructor(
    message: string,
    public readonly platform: PlatformType,
    public readonly code: string,
    public readonly retryable: boolean,
    public readonly userMessage: string,
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 인증 관련 에러
export class PlatformAuthError extends BasePlatformError {
  readonly code = "AUTH_ERROR";
  readonly retryable = false;

  constructor(
    public readonly platform: PlatformType,
    message: string,
    public readonly userMessage: string = "인증에 실패했습니다. 계정을 다시 연결해주세요.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 토큰 만료 에러
export class PlatformTokenExpiredError extends BasePlatformError {
  readonly code = "TOKEN_EXPIRED";
  readonly retryable = true;

  constructor(
    public readonly platform: PlatformType,
    message: string = "토큰이 만료되었습니다",
    public readonly userMessage: string = "인증 토큰이 만료되었습니다. 자동으로 갱신을 시도합니다.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// API 호출 제한 에러
export class PlatformRateLimitError extends BasePlatformError {
  readonly code = "RATE_LIMIT";
  readonly retryable = true;

  constructor(
    public readonly platform: PlatformType,
    public readonly retryAfterSeconds: number,
    message: string = "API 호출 제한에 걸렸습니다",
    public readonly userMessage: string = "API 호출 제한에 걸렸습니다. 잠시 후 다시 시도됩니다.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 계정 권한 에러
export class PlatformPermissionError extends BasePlatformError {
  readonly code = "PERMISSION_ERROR";
  readonly retryable = false;

  constructor(
    public readonly platform: PlatformType,
    message: string,
    public readonly userMessage: string = "계정에 필요한 권한이 없습니다. 관리자에게 문의하세요.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 잘못된 계정 ID 에러
export class PlatformInvalidAccountError extends BasePlatformError {
  readonly code = "INVALID_ACCOUNT";
  readonly retryable = false;

  constructor(
    public readonly platform: PlatformType,
    public readonly accountId: string,
    message: string,
    public readonly userMessage: string = "유효하지 않은 계정 ID입니다. 계정을 다시 연결해주세요.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// API 연결 에러
export class PlatformConnectionError extends BasePlatformError {
  readonly code = "CONNECTION_ERROR";
  readonly retryable = true;

  constructor(
    public readonly platform: PlatformType,
    message: string,
    public readonly userMessage: string = "플랫폼 연결에 실패했습니다. 잠시 후 다시 시도해주세요.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 구성 에러
export class PlatformConfigError extends BasePlatformError {
  readonly code = "CONFIG_ERROR";
  readonly retryable = false;

  constructor(
    public readonly platform: PlatformType,
    message: string,
    public readonly userMessage: string = "플랫폼 설정에 문제가 있습니다. 관리자에게 문의하세요.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 데이터 처리 에러
export class PlatformDataError extends BasePlatformError {
  readonly code = "DATA_ERROR";
  readonly retryable = false;

  constructor(
    public readonly platform: PlatformType,
    message: string,
    public readonly userMessage: string = "데이터 처리 중 오류가 발생했습니다.",
    originalError?: Error,
  ) {
    super(message, originalError);
  }
}

// 에러 핸들러 유틸리티
export class PlatformErrorHandler {
  /**
   * 플랫폼별 에러를 파싱하여 적절한 PlatformError로 변환
   */
  static parseError(platform: PlatformType, error: unknown): PlatformError {
    if (error instanceof PlatformError) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    switch (platform) {
      case "google":
        return this.parseGoogleAdsError(
          errorMessage,
          error instanceof Error ? error : undefined,
        );
      case "facebook":
        return this.parseMetaAdsError(
          errorMessage,
          error instanceof Error ? error : undefined,
        );
      case "amazon":
        return this.parseAmazonAdsError(
          errorMessage,
          error instanceof Error ? error : undefined,
        );
      default:
        return new PlatformConnectionError(
          platform,
          errorMessage,
          undefined,
          error instanceof Error ? error : undefined,
        );
    }
  }

  private static parseGoogleAdsError(
    message: string,
    originalError?: Error,
  ): PlatformError {
    if (message.includes("INVALID_CUSTOMER_ID")) {
      return new PlatformInvalidAccountError(
        "google",
        "unknown",
        message,
        "Google Ads 고객 ID가 유효하지 않습니다. 계정을 다시 연결해주세요.",
        originalError,
      );
    }

    if (
      message.includes("UNAUTHENTICATED") ||
      message.includes("AUTHENTICATION_ERROR")
    ) {
      return new PlatformAuthError("google", message, undefined, originalError);
    }

    if (
      message.includes("QUOTA_EXCEEDED") ||
      message.includes("RATE_LIMIT_EXCEEDED")
    ) {
      return new PlatformRateLimitError(
        "google",
        60,
        message,
        undefined,
        originalError,
      );
    }

    if (message.includes("PERMISSION_DENIED")) {
      return new PlatformPermissionError(
        "google",
        message,
        undefined,
        originalError,
      );
    }

    return new PlatformConnectionError(
      "google",
      message,
      undefined,
      originalError,
    );
  }

  private static parseMetaAdsError(
    message: string,
    originalError?: Error,
  ): PlatformError {
    if (
      message.includes("Invalid OAuth access token") ||
      message.includes("OAuthException")
    ) {
      return new PlatformAuthError(
        "facebook",
        message,
        undefined,
        originalError,
      );
    }

    if (
      message.includes("Application request limit reached") ||
      message.includes("User request limit reached")
    ) {
      return new PlatformRateLimitError(
        "facebook",
        300,
        message,
        undefined,
        originalError,
      );
    }

    if (
      message.includes("Insufficient permission") ||
      message.includes("Permission denied")
    ) {
      return new PlatformPermissionError(
        "facebook",
        message,
        undefined,
        originalError,
      );
    }

    if (
      message.includes("Invalid parameter") &&
      message.includes("account_id")
    ) {
      return new PlatformInvalidAccountError(
        "facebook",
        "unknown",
        message,
        undefined,
        originalError,
      );
    }

    return new PlatformConnectionError(
      "facebook",
      message,
      undefined,
      originalError,
    );
  }

  private static parseAmazonAdsError(
    message: string,
    originalError?: Error,
  ): PlatformError {
    if (message.includes("UNAUTHORIZED") || message.includes("401")) {
      return new PlatformAuthError("amazon", message, undefined, originalError);
    }

    if (message.includes("429") || message.includes("Too Many Requests")) {
      return new PlatformRateLimitError(
        "amazon",
        60,
        message,
        undefined,
        originalError,
      );
    }

    if (
      message.includes("Invalid profile") ||
      message.includes("Invalid account")
    ) {
      return new PlatformInvalidAccountError(
        "amazon",
        "unknown",
        message,
        undefined,
        originalError,
      );
    }

    if (message.includes("ACCESS_DENIED") || message.includes("FORBIDDEN")) {
      return new PlatformPermissionError(
        "amazon",
        message,
        undefined,
        originalError,
      );
    }

    return new PlatformConnectionError(
      "amazon",
      message,
      undefined,
      originalError,
    );
  }

  /**
   * 사용자에게 표시할 친화적인 에러 메시지 생성
   */
  static getUserFriendlyMessage(error: PlatformError): string {
    return error.userMessage;
  }

  /**
   * 에러가 재시도 가능한지 확인
   */
  static isRetryable(error: PlatformError): boolean {
    return error.retryable;
  }

  /**
   * 재시도 지연 시간 계산
   */
  static getRetryDelay(error: PlatformError): number {
    if (error instanceof PlatformRateLimitError) {
      return error.retryAfterSeconds * 1000;
    }

    return 5000; // 기본 5초
  }
}
