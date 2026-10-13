import { db } from "@/db";
import { featuredMovies, movies } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL, invalidateCache } from "@/lib/cache";
import { batchMovieTags } from "@/services/movie-tags";
import { cacheKeys } from "@/lib/cache-keys";
import { ErrorCode } from "@/lib/api-errors";
import type { FeaturedItem } from "@/types";

export async function getFeatured(): Promise<FeaturedItem[]> {
  return cacheGetOrSet(cacheKeys.homeFeatured("movies"), CACHE_TTL.SLOW, async () => {
    const items = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        thumbnailUrl: movies.thumbnailUrl,
        backdropUrl: movies.backdropUrl,
        releaseDate: movies.releaseDate,
        durationSeconds: movies.durationSeconds,
      })
      .from(featuredMovies)
      .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
      .orderBy(asc(featuredMovies.displayOrder));

    if (items.length > 0) {
      const tagsByMovieId = await batchMovieTags(items.map((m) => m.id));

      return items.map((item) => ({
        ...item,
        tags: (tagsByMovieId.get(item.id) ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      }));
    }

    return items.map((item) => ({ ...item, tags: [] as FeaturedItem["tags"] }));
  });
}

export interface FeaturedAdminRow {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  movieId: number;
}

export async function listAdminFeatured(): Promise<FeaturedAdminRow[]> {
  const rows = await db
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

  return rows;
}

export async function addFeatured(movieId: number) {
  const [existing] = await db
    .select({ id: featuredMovies.id })
    .from(featuredMovies)
    .where(eq(featuredMovies.movieId, movieId))
    .limit(1);
  if (existing) {
    return { error: { message: "Movie is already featured", code: ErrorCode.Conflict } };
  }
  const [created] = await db
    .insert(featuredMovies)
    .values({
      movieId,
      displayOrder: sql<number>`(SELECT COALESCE(MAX(${featuredMovies.displayOrder}), -1) + 1 FROM ${featuredMovies})`,
    })
    .returning();

  await invalidateCache("home");
  return created;
}

export async function updateFeatured(id: number, displayOrder: number) {
  const [updated] = await db
    .update(featuredMovies)
    .set({ displayOrder })
    .where(eq(featuredMovies.id, id))
    .returning();
  if (!updated) return null;
  await invalidateCache("home");
  return updated;
}

export async function deleteFeatured(id: number): Promise<boolean> {
  const [deleted] = await db.delete(featuredMovies).where(eq(featuredMovies.id, id)).returning();
  if (!deleted) return false;
  await invalidateCache("home");
  return true;
}