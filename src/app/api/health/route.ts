import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();
  const checks: Record<string, { status: string; latencyMs: number | null }> = {};

  try {
    const dbStart = performance.now();
    await db.execute(sql`SELECT 1`);
    checks.db = { status: "ok", latencyMs: Math.round(performance.now() - dbStart) };
  } catch (err) {
    logger.error("health", "DB check failed", err);
    checks.db = { status: "error", latencyMs: null };
  }

  if (redis) {
    try {
      const redisStart = performance.now();
      await redis.ping();
      checks.redis = { status: "ok", latencyMs: Math.round(performance.now() - redisStart) };
    } catch (err) {
      logger.error("health", "Redis check failed", err);
      checks.redis = { status: "error", latencyMs: null };
    }
  } else {
    checks.redis = { status: "unconfigured", latencyMs: null };
  }

  const overall = Object.values(checks).every((c) => c.status === "ok" || c.status === "unconfigured") ? "ok" : "degraded";

  return NextResponse.json({
    status: overall,
    uptime: Math.floor(process.uptime()),
    responseTimeMs: Math.round(performance.now() - start),
    checks,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
