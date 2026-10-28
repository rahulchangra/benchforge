import { NextRequest, NextResponse } from "next/server";

/** Routes that don't require authentication */
const publicPaths = ["/", "/login"];

/** Prefixes that are always public */
const publicPrefixes = ["/api/auth", "/api/health", "/_next", "/favicon.ico"];

/** Static asset extensions */
const staticExtensions =
  /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot|map)$/;

/** Attach modern security headers to every response */
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Content Security Policy (defense-in-depth)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: http:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

/**
 * When GITHUB_CLIENT_ID is not set, auth is skipped (demo mode).
 * This lets the app deploy and run on Vercel without an OAuth app.
 */
const authEnabled =
  !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.includes(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Allow public prefixes
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Allow static assets
  if (staticExtensions.test(pathname)) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Demo mode - skip auth when OAuth is not configured (development/demo only)
  if (!authEnabled) {
    if (process.env.NODE_ENV === "production") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "OAuthRequired");
      return NextResponse.redirect(loginUrl);
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // Auth is configured - check session token cookie directly (Edge runtime safe)
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\.ico).*)"],
};
