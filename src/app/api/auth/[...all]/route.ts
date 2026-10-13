import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { withPublic } from "@/lib/with-auth";

const handler = toNextJsHandler(auth);

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

export const GET = withPublic<{ all: string[] }>(async (request) => {
  const ip = getClientIp(request);
  const { allowed } = await rateLimit(`auth:${ip}`, RATE_LIMITS.auth);
  if (!allowed) return rateLimitResponse();
  return handler.GET(request);
});

export const POST = withPublic<{ all: string[] }>(async (request) => {
  const ip = getClientIp(request);
  const { allowed } = await rateLimit(`auth:${ip}`, RATE_LIMITS.auth);
  if (!allowed) return rateLimitResponse();
  return handler.POST(request);
});
