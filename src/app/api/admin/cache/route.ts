import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { validateBody } from "@/lib/api-errors";
import { cacheFlushApiSchema } from "@/lib/schemas";
import { cacheFlushAll, invalidateCache, type CacheScope } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";

export const POST = withAdminAuth(async (request, { session }) => {
  const { allowed } = await rateLimit(`cache-flush:${session.user.id}`, RATE_LIMITS.cacheFlush);
  if (!allowed) return rateLimitResponse();

  const body = await request.json();
  const parsed = validateBody(cacheFlushApiSchema, body);
  if ("error" in parsed) return parsed.error;
  const { scope } = parsed.data;

  if (scope === "all") {
    const flushed = await cacheFlushAll();
    logger.info("admin/cache", `flushed by ${session.user.id} scope=all keys=${flushed}`);
    return NextResponse.json(
      { data: { flushed, scope } },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const flushed = await invalidateCache(scope as CacheScope);
  logger.info("admin/cache", `flushed by ${session.user.id} scope=${scope} keys=${flushed}`);
  return NextResponse.json(
    { data: { flushed, scope } },
    { headers: { "Cache-Control": "no-store" } }
  );
});
