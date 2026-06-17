import { NextResponse, type NextRequest } from "next/server";

/**
 * Opsvera Proxy (formerly Middleware)
 * 
 * Handles:
 * 1. Authentication gating — redirect unauthenticated users to login
 * 2. Auth page redirect — redirect authenticated users away from login/register
 * 3. Onboarding enforcement — redirect users without a company to onboarding
 * 4. Static/API passthrough — allow public assets and API routes
 */

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];
const ONBOARDING_ROUTES = ["/onboarding"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isOnboardingRoute(pathname: string): boolean {
  return ONBOARDING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and static assets to pass through
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  const sessionCookie = request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie?.value;

  // Public routes — allow always
  if (isPublicRoute(pathname) && !isOnboardingRoute(pathname)) {
    // If authenticated and trying to access login/register, redirect to dashboard
    if (isAuthenticated && isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated and trying to access protected route
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // At this point, user is authenticated.
  // For full SaaS: decode session to check companyId.
  // Since we can't decode the session in edge environment without a DB call,
  // we rely on server-side checks in layouts/pages for:
  // - companyId existence (redirect to onboarding)
  // - role-based access (admin routes)
  // 
  // The proxy provides the first line of defense (auth check).
  // Granular RBAC is enforced in server components, server actions, and API routes.

  const response = NextResponse.next();

  // For authenticated routes, add cache-control headers to prevent bfcache (back button issue)
  if (isAuthenticated && !isPublicRoute(pathname)) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by route handlers)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
