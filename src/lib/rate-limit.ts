import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ErrorCode } from "@/lib/api-errors";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

// Clean expired entries every 60 seconds. The guard keeps this module
// import-safe on runtimes where setInterval has no unref (e.g. Edge).
const MEMORY_CLEAN_INTERVAL = 60_000;
const cleanTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
}, MEMORY_CLEAN_INTERVAL);
(cleanTimer as unknown as { unref?: () => void }).unref?.();

export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;

export interface RateLimitPreset {
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: MINUTE_MS },
  cacheFlush: { limit: 5, windowMs: MINUTE_MS },
  chat: { limit: 5, windowMs: MINUTE_MS },
  movieChat: { limit: 8, windowMs: MINUTE_MS },
  adminChat: { limit: 10, windowMs: MINUTE_MS },
  comments: { limit: 20, windowMs: MINUTE_MS },
  report: { limit: 20, windowMs: HOUR_MS },
  requests: { limit: 10, windowMs: HOUR_MS },
  search: { limit: 30, windowMs: MINUTE_MS },
  tmdb: { limit: 30, windowMs: MINUTE_MS },
  upload: { limit: 20, windowMs: MINUTE_MS },
  watchlist: { limit: 60, windowMs: MINUTE_MS },
} as const satisfies Record<string, RateLimitPreset>;

export async function rateLimit(key: string, preset: RateLimitPreset = RATE_LIMITS.search) {
  const { limit, windowMs } = preset;
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
    { error: { message: "Too many requests. Please try again later.", code: ErrorCode.RateLimited } },
    { status: 429 }
  );
}