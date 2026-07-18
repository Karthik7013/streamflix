import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export default async function proxy(request: NextRequest) {
  // Skip rate limiting for auth routes — they have their own auth checks
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
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
