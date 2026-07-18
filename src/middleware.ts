import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((-base64.length) & 3);
  return atob(padded);
}

function getAdminFromCookie(request: NextRequest): boolean {
  for (const name of [
    `__Secure-better-auth.session_data`,
    `better-auth.session_data`,
    `__Secure-better-auth-session_data`,
    `better-auth-session_data`,
  ]) {
    const value = request.cookies.get(name)?.value;
    if (!value) continue;
    try {
      const payload = JSON.parse(base64urlDecode(value));
      if (payload?.user?.role === "admin") return true;
    } catch {
      // malformed cookie — ignore
    }
  }
  return false;
}

export default async function middleware(request: NextRequest) {
  // Skip rate limiting for auth routes, health endpoint, and admin users
  if (
    request.nextUrl.pathname.startsWith("/api/auth/") ||
    request.nextUrl.pathname.startsWith("/api/health") ||
    getAdminFromCookie(request)
  ) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const routeKey = `api:${pathname}:${ip}`;
  const { allowed } = await rateLimit(routeKey, 30, 60_000);
  if (!allowed) {
    return rateLimitResponse();
  }

  return NextResponse.next();
}
