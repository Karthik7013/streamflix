import { db } from "@/db";
import { movies } from "@/db/schema";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";

export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  releaseDate: string | null;
}

// DB-managed generated column (migration 0019): ALTER TABLE "movies" ADD COLUMN
// "title_search" tsvector GENERATED ALWAYS AS (to_tsvector(...)) STORED.
// Intentionally absent from src/db/schema.ts: drizzle-kit has no native tsvector
// type and customType({"tsvector"}) emits broken diff SQL
// ('"undefined"."tsvector"'), so mapping it breaks db:generate. Keep all
// references to the column behind this fragment.
const TITLE_SEARCH = sql`"title_search"`;

export async function searchAutocomplete(q: string): Promise<SearchResult[]> {
  const cacheKey = cacheKeys.searchAutocomplete(q);

  return cacheGetOrSet(cacheKey, CACHE_TTL.FAST, async () => {
    try {
      const pattern = `%${q}%`;
      const results = await db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
          releaseDate: movies.releaseDate,
        })
        .from(movies)
        .where(
          sql`(${TITLE_SEARCH} @@ websearch_to_tsquery('english', ${q}) OR ${movies.title} ILIKE ${pattern}) AND ${movies.published} = true`
        )
        .orderBy(sql`ts_rank(${TITLE_SEARCH}, websearch_to_tsquery('english', ${q})) + similarity(${movies.title}, ${q}) DESC`)
        .limit(10);

      return results;
    } catch (err) {
      logger.error("searchAutocomplete", "DB error:", err);
      return [];
    }
  });
}
