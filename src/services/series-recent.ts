import { db } from "@/db";
import { series } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export interface SeriesCardItem {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export async function getTop10Series(): Promise<SeriesCardItem[]> {
  return cacheGetOrSet("series:top-10", CACHE_TTL.SLOW, async () => {
    return db
      .select({
        id: series.id,
        title: series.title,
        slug: series.slug,
        thumbnailUrl: series.thumbnailUrl,
      })
      .from(series)
      .where(eq(series.published, true))
      .orderBy(desc(series.createdAt))
      .limit(10);
  });
}
