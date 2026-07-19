import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export async function getRecentlyAdded() {
  return cacheGetOrSet("recently-added", CACHE_TTL.DEFAULT, async () => {
    return db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies)
      .where(eq(movies.published, true))
      .orderBy(desc(movies.createdAt))
      .limit(10);
  });
}
