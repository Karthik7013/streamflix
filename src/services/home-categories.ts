import { db } from "@/db";
import { tags, movieTags } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { searchMovies } from "@/services/movies";

const TOP_CATEGORIES_LIMIT = 6;

export async function getHomeCategories() {
  const tagCounts = await db
    .select({
      id: tags.id,
      name: tags.name,
      movieCount: count(),
    })
    .from(tags)
    .innerJoin(movieTags, eq(tags.id, movieTags.tagId))
    .groupBy(tags.id, tags.name)
    .orderBy(desc(count()))
    .limit(TOP_CATEGORIES_LIMIT);

  if (tagCounts.length === 0) return [];

  const categories = await Promise.all(
    tagCounts.map(async (tag) => {
      const { movies: categoryMovies } = await searchMovies({
        tagsParam: String(tag.id),
        limit: 10,
      });
      return {
        tag: { id: tag.id, name: tag.name },
        movies: categoryMovies,
      };
    })
  );

  return categories.filter((c) => c.movies.length > 0);
}
