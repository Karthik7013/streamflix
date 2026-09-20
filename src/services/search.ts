import { db } from "@/db";
import { movies } from "@/db/schema";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  releaseDate: string | null;
}

export async function searchAutocomplete(q: string): Promise<SearchResult[]> {
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
        sql`(title_search @@ websearch_to_tsquery('english', ${q}) OR ${movies.title} ILIKE ${pattern}) AND ${movies.published} = true`
      )
      .orderBy(sql`ts_rank(title_search, websearch_to_tsquery('english', ${q})) + similarity(${movies.title}, ${q}) DESC`)
      .limit(10);

    return results;
  } catch (err) {
    logger.error("searchAutocomplete", "DB error:", err);
    return [];
  }
}
