import { db } from "@/db";
import { shorts } from "@/db/schema";
import { desc, lt } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { SHORTS_LIMIT } from "@/lib/constants";
import type { ShortsPage } from "@/types";

export async function getShorts({ limit = SHORTS_LIMIT, cursor }: { limit?: number; cursor?: number }): Promise<ShortsPage> {
  const cacheKey = cacheKeys.shorts(limit, cursor);

  return cacheGetOrSet(cacheKey, CACHE_TTL.DEFAULT, async () => {
    const query = db
      .select({
        id: shorts.id,
        title: shorts.title,
        mp4Url: shorts.mp4Url,
        posterUrl: shorts.posterUrl,
        createdAt: shorts.createdAt,
        updatedAt: shorts.updatedAt,
      })
      .from(shorts)
      .orderBy(desc(shorts.id))
      .limit(limit + 1);

    if (cursor) {
      query.where(lt(shorts.id, cursor));
    }

    const rows = await query;
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return {
      data: page.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  });
}
