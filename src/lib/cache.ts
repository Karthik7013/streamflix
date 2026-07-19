import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const CACHE_PREFIX = "app:";

async function findKeys(pattern: string): Promise<string[]> {
  if (!redis) return [];
  const keys: string[] = [];
  let cursor = 0;
  do {
    const [nextCursor, found] = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    });
    cursor = Number(nextCursor);
    keys.push(...found);
  } while (cursor !== 0);
  return keys;
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`${CACHE_PREFIX}${key}`);
  } catch (err) {
    logger.error("cache", "Redis unavailable on del", err);
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  ttl: number,
  fetch: () => Promise<T>,
  getTtl?: (data: T) => number
): Promise<T> {
  if (!redis) return fetch();
  const fullKey = `${CACHE_PREFIX}${key}`;

  try {
    const cached = await redis.get<T>(fullKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (err) {
    logger.error("cache", "Redis unavailable on get, falling through to DB", err);
  }
  const fresh = await fetch();
  try {
    const actualTtl = getTtl ? getTtl(fresh) : ttl;
    if (actualTtl > 0) {
      await redis.setex(fullKey, actualTtl, JSON.stringify(fresh));
    }
  } catch (err) {
    logger.error("cache", "Redis unavailable on set, cache write failed", err);
  }
  return fresh;
}

export const CACHE_TTL = {
  FAST: 120,
  DEFAULT: 300,
  SLOW: 600,
} as const;

const INVALIDATION_KEYS = {
  "movies-list": ["movies:*"],
  "movie-detail": ["movie:*"],
  home: ["home:*"],
  tags: ["tags:all", "related:*"],
  favorites: ["favorites:*"],
  requests: ["requests:*"],
  "series-list": ["series-list:*"],
  "series-detail": ["series:*"],
  admin: ["admin:*"],
  comments: ["comments:*"],
  reports: ["reports:*"],
  shorts: ["shorts:*"],
} as const;

export type CacheScope = keyof typeof INVALIDATION_KEYS;

export async function invalidateCache(
  scope: keyof typeof INVALIDATION_KEYS
): Promise<void> {
  if (!redis) return;
  const patterns = INVALIDATION_KEYS[scope];
  try {
    const pipeline = redis.pipeline();
    let hasCommands = false;
    for (const pattern of patterns) {
      const keys = await findKeys(`${CACHE_PREFIX}${pattern}`);
      if (keys.length > 0) {
        pipeline.del(...keys);
        hasCommands = true;
      }
    }
    if (hasCommands) {
      await pipeline.exec();
    }
  } catch (err) {
    logger.error("redis", "cache invalidation failed for", scope, ":", err);
  }
}
