import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { TOP_10_LIMIT } from "@/lib/constants";

export async function getTop10Movies() {
  return cacheGetOrSet(cacheKeys.homeTop10, CACHE_TTL.SLOW, () =>
    db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies)
      .where(eq(movies.published, true))
      .orderBy(desc(movies.createdAt))
      .limit(TOP_10_LIMIT)
  );
}
