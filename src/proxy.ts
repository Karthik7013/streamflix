import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const { allowed } = await rateLimit(`api:${ip}`, 60, 60_000);
  if (!allowed) {
    return rateLimitResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
