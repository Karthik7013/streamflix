import Redis from "ioredis";

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    lazyConnect: true,
  });
}

export async function cacheGetOrSet<T>(
  key: string,
  ttl: number,
  fetch: () => Promise<T>
): Promise<T> {
  if (!redis) return fetch();
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch {
    // Redis unavailable — fall through to DB
  }
  const fresh = await fetch();
  try {
    await redis.setex(key, ttl, JSON.stringify(fresh));
  } catch {
    // Redis unavailable — cache write failed
  }
  return fresh;
}
