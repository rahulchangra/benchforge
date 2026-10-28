import { NextRequest, NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { ensureSchema } from "@/lib/ensure-schema";
import { applyRateLimit } from "@/lib/rate-limit";

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

/** Create a success response */
export function apiSuccess<T>(data: T, meta?: ApiResponse["meta"]): NextResponse {
  return NextResponse.json({ success: true, data, meta } satisfies ApiResponse<T>);
}

/** Create an error response */
export function apiError(
  message: string,
  status = 400,
  errors?: ApiResponse["errors"]
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, errors } satisfies ApiResponse,
    { status }
  );
}

/** Parse and validate request body with Zod */
export async function parseBody<T>(
  request: NextRequest,
  schema: ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return { data: null, error: apiError("Validation failed", 400, errors) };
    }
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: apiError("Invalid JSON body", 400) };
  }
}

/** Parse query parameters with defaults */
export function parseQuery(request: NextRequest) {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10)));
  const search = url.searchParams.get("search") ?? undefined;
  const sort = url.searchParams.get("sort") ?? undefined;
  const order = (url.searchParams.get("order") ?? "desc") as "asc" | "desc";

  return { page, perPage, search, sort, order, params: url.searchParams };
}

/** Wrap an API handler with error handling and optional rate limiting */
export function withErrorHandling(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>,
  options?: { rateLimit?: boolean; limit?: number; windowMs?: number }
) {
  return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
    try {
      if (options?.rateLimit) {
        const rateLimitResponse = applyRateLimit(
          request,
          options.limit ?? 60,
          options.windowMs ?? 60_000
        );
        if (rateLimitResponse) {
          return new NextResponse(rateLimitResponse.body, {
            status: rateLimitResponse.status,
            headers: rateLimitResponse.headers,
          });
        }
      }
      await ensureSchema();
      return await handler(request, context);
    } catch (error) {
      console.error("API Error:", error);
      const isProd = process.env.NODE_ENV === "production";
      const message =
        isProd
          ? "Internal server error"
          : error instanceof Error
            ? error.message
            : "Internal server error";
      return apiError(message, 500);
    }
  };
}

/** Pagination helper for Prisma queries */
export function paginationArgs(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

/** Build pagination meta */
export function paginationMeta(
  total: number,
  page: number,
  perPage: number
): ApiResponse["meta"] {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}
