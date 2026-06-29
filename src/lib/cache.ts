import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const CACHE_PREFIX = "app:";

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(`${CACHE_PREFIX}${key}`);
  } catch {
    // Redis unavailable
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
  } catch {
    // Redis unavailable — fall through to DB
  }
  const fresh = await fetch();
  try {
    const actualTtl = getTtl ? getTtl(fresh) : ttl;
    if (actualTtl > 0) {
      await redis.setex(fullKey, actualTtl, fresh as any);
    }
  } catch {
    // Redis unavailable — cache write failed
  }
  return fresh;
}

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
} as const;

export async function invalidateCache(
  scope: keyof typeof INVALIDATION_KEYS
): Promise<void> {
  if (!redis) return;
  const patterns = INVALIDATION_KEYS[scope];
  try {
    const pipeline = redis.pipeline();
    for (const pattern of patterns) {
      if (pattern.endsWith("*")) {
        const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
        if (keys.length > 0) {
          pipeline.del(...keys);
        }
      } else {
        pipeline.del(`${CACHE_PREFIX}${pattern}`);
      }
    }
    await pipeline.exec();
  } catch (err) {
    console.error("[redis] cache invalidation failed for", scope, ":", err);
  }
}
