import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();

  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      }
      return { allowed: current <= limit };
    } catch (err) {
      logger.error("rate-limit", "Redis unavailable, falling through to memory store", err);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  return { allowed: entry.count <= limit };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" } },
    { status: 429 }
  );
}
