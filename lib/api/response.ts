import { NextResponse } from "next/server";

/**
 * Standard API success response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: any;
  };
}

/**
 * Create successful response
 */
export function successResponse<T>(
  data?: T,
  options?: {
    message?: string;
    meta?: ApiResponse["meta"];
    status?: number;
  },
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (options?.message) {
    response.message = options.message;
  }

  if (options?.meta) {
    response.meta = options.meta;
  }

  return NextResponse.json(response, { status: options?.status || 200 });
}

/**
 * Create no content response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create created response
 */
export function createdResponse<T>(data: T, message?: string): NextResponse {
  return successResponse(data, { message, status: 201 });
}

/**
 * Create paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
): NextResponse {
  return successResponse(data, {
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
}

/**
 * Helper to parse pagination params from request
 */
export function getPaginationParams(request: Request): {
  page: number;
  limit: number;
  offset: number;
} {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "20")),
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Helper to parse filter params from request
 */
export function getFilterParams(
  request: Request,
  allowedFilters: string[],
): Record<string, string> {
  const url = new URL(request.url);
  const filters: Record<string, string> = {};

  for (const filter of allowedFilters) {
    const value = url.searchParams.get(filter);

    if (value) {
      filters[filter] = value;
    }
  }

  return filters;
}

/**
 * Helper to parse sort params from request
 */
export function getSortParams(
  request: Request,
  allowedSorts: string[],
  defaultSort = "created_at",
): { sortBy: string; sortOrder: "asc" | "desc" } {
  const url = new URL(request.url);
  const sortBy = url.searchParams.get("sortBy") || defaultSort;
  const sortOrder = (url.searchParams.get("sortOrder") || "desc") as
    | "asc"
    | "desc";

  if (!allowedSorts.includes(sortBy)) {
    return { sortBy: defaultSort, sortOrder: "desc" };
  }

  return { sortBy, sortOrder };
}
