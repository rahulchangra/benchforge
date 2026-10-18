// =============================================================================
// In-memory rate limiter
// =============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now >= entry.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60_000);
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Simple in-memory rate limiter.
 *
 * @param key      - Unique identifier (typically client IP or user ID)
 * @param limit    - Maximum requests allowed in the window (default: 60)
 * @param windowMs - Time window in milliseconds (default: 60 000 = 1 minute)
 * @returns        - { success, remaining, reset }
 */
export function rateLimit(
  key: string,
  limit: number = 60,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now >= entry.resetAt) {
    // First request or window expired — start a new window
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, reset: resetAt };
  }

  // Within existing window
  entry.count += 1;

  if (entry.count > limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  return {
    success: true,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

/**
 * Helper to apply rate limiting in API route handlers.
 * Returns a Response if rate-limited, or null if the request may proceed.
 *
 * @example
 * ```ts
 * const blocked = applyRateLimit(request);
 * if (blocked) return blocked;
 * ```
 */
export function applyRateLimit(
  request: Request,
  limit: number = 60,
  windowMs: number = 60_000,
): Response | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  const result = rateLimit(ip, limit, windowMs);

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      },
    );
  }

  return null;
}
