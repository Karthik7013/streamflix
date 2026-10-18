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

// Next.js throws a DYNAMIC_SERVER_USAGE digest error to bail out of static
// prerendering when cache helpers run at build time. That is control flow,
// not an outage — stay quiet so build logs aren't buried in false alarms.
function isPrerenderBailout(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    (err as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

function logCacheError(context: string, message: string, err: unknown): void {
  if (isPrerenderBailout(err)) return;
  logger.error(context, message, err);
}

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

export async function cacheDelByPrefix(prefix: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await findKeys(`${CACHE_PREFIX}${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    logCacheError("cache", "Redis unavailable on prefix del", err);
  }
}

export async function cacheFlushAll(): Promise<number> {
  if (!redis) return 0;
  try {
    const keys = await findKeys(`${CACHE_PREFIX}*`);
    if (keys.length === 0) return 0;
    await redis.del(...keys);
    return keys.length;
  } catch (err) {
    logCacheError("cache", "Redis unavailable on flush all", err);
    return 0;
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
    logCacheError("cache", "Redis unavailable on get, falling through to DB", err);
  }
  const fresh = await fetch();
  try {
    const actualTtl = getTtl ? getTtl(fresh) : ttl;
    if (actualTtl > 0) {
      await redis.setex(fullKey, actualTtl, JSON.stringify(fresh));
    }
  } catch (err) {
    logCacheError("cache", "Redis unavailable on set, cache write failed", err);
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
  "movie-detail": ["movie:*", "related:*", "movie-credits:*"],
  home: ["home:*"],
  tags: ["tags:all", "tag:*", "tag-movies:*", "related:*"],
  people: ["people:all", "person:*", "movie-credits:*", "movie:*"],
  "movie-credits": ["movie-credits:*", "person:*", "movie:*"],
  watchlist: ["watchlist:*"],
  requests: ["requests:*"],
  admin: ["admin:*"],
  comments: ["comments:*"],
  reports: ["reports:*"],
  shorts: ["shorts:*"],
  "tag-movies": ["tag-movies:*", "tag:*"],
} as const;

export type CacheScope = keyof typeof INVALIDATION_KEYS;

export async function invalidateCache(
  scope: keyof typeof INVALIDATION_KEYS
): Promise<number> {
  if (!redis) return 0;
  const patterns = INVALIDATION_KEYS[scope];
  try {
    const pipeline = redis.pipeline();
    let hasCommands = false;
    let count = 0;
    for (const pattern of patterns) {
      const keys = await findKeys(`${CACHE_PREFIX}${pattern}`);
      if (keys.length > 0) {
        pipeline.del(...keys);
        hasCommands = true;
        count += keys.length;
      }
    }
    if (hasCommands) {
      await pipeline.exec();
    }
    return count;
  } catch (err) {
    logCacheError("redis", `cache invalidation failed for ${scope}`, err);
    return 0;
  }
}
