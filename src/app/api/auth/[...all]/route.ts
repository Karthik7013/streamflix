import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = await rateLimit(`auth:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse();
  return handler.GET(request);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = await rateLimit(`auth:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse();
  return handler.POST(request);
}
