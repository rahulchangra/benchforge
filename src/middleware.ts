import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Routes that don't require authentication */
const publicPaths = [
  "/",
  "/login",
];

/** Prefixes that are always public */
const publicPrefixes = [
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

/** Static asset extensions */
const staticExtensions = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot|map)$/;

/** Attach security headers to every response */
function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

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

  // Check auth
  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
