import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

const ADMIN_PATHS = ["/admin"];
const PROTECTED_PATHS = ["/watchlist", "/settings"];
const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function getNonce() {
  return crypto.randomUUID();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = getNonce();

  const session = await auth.api.getSession({ headers: request.headers });
  const isLoggedIn = !!session;

  if (isAdminPath(pathname)) {
    if (!isLoggedIn || session.user.role !== "admin") {
      const url = new URL("/login", request.url);
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPath(pathname) && isLoggedIn) {
    const redirect = request.nextUrl.searchParams.get("redirect") || "/home";
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  const response = NextResponse.next();

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.youtube.com https://pagead2.googlesyndication.com https://*.vercel-insights.com`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https:",
    "media-src https: blob:",
    "connect-src 'self' https: wss:",
    "font-src 'self' data:",
    "frame-src https://www.youtube.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
