import { db } from "@/db";
import { featuredMovies, movies, movieTags, tags } from "@/db/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { cacheGetOrSet } from "@/lib/cache";

export async function getFeatured() {
  return cacheGetOrSet("home:featured", 600, async () => {
    const items = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        releaseDate: movies.releaseDate,
        durationSeconds: movies.durationSeconds,
        thumbnailUrl: movies.thumbnailUrl,
        backdropUrl: movies.backdropUrl,
      })
      .from(featuredMovies)
      .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
      .orderBy(asc(featuredMovies.displayOrder));

    if (items.length > 0) {
      const featuredIds = items.map((m) => m.id);
      const tagRows = await db
        .select({ movieId: movieTags.movieId, id: tags.id, name: tags.name })
        .from(movieTags)
        .innerJoin(tags, eq(movieTags.tagId, tags.id))
        .where(inArray(movieTags.movieId, featuredIds));

      const tagsByMovie: Record<number, { id: number; name: string }[]> = {};
      for (const row of tagRows) {
        if (!tagsByMovie[row.movieId]) tagsByMovie[row.movieId] = [];
        tagsByMovie[row.movieId].push({ id: row.id, name: row.name });
      }

      for (const movie of items) {
        (movie as Record<string, unknown>).tags = tagsByMovie[movie.id] || [];
      }
    }

    return items;
  });
}

export async function listAdminFeatured() {
  const result = await db
    .select({
      id: featuredMovies.id,
      movieId: featuredMovies.movieId,
      displayOrder: featuredMovies.displayOrder,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
    })
    .from(featuredMovies)
    .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
    .orderBy(asc(featuredMovies.displayOrder));

  return result;
}

export async function addFeatured(movieId: number) {
  const [maxResult] = await db
    .select({ max: sql<number>`COALESCE(MAX(${featuredMovies.displayOrder}), -1)` })
    .from(featuredMovies);

  const nextOrder = (maxResult?.max ?? -1) + 1;
  const [created] = await db.insert(featuredMovies).values({ movieId, displayOrder: nextOrder }).returning();

  invalidateCache("home");
  return created;
}

export async function updateFeatured(id: number, displayOrder: number) {
  const [updated] = await db
    .update(featuredMovies)
    .set({ displayOrder })
    .where(eq(featuredMovies.id, id))
    .returning();

  if (!updated) return null;

  invalidateCache("home");
  return updated;
}

export async function deleteFeatured(id: number) {
  const [deleted] = await db.delete(featuredMovies).where(eq(featuredMovies.id, id)).returning();
  if (!deleted) return false;

  invalidateCache("home");
  return true;
}
