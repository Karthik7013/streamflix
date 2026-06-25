import { db } from "@/db";
import { favorites, movies } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

export async function toggleFavorite(movieId: number, userId: string) {
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.movieId, movieId)));
    invalidateCache("favorites");
    return { isFavorited: false };
  }

  await db.insert(favorites).values({ userId, movieId });
  invalidateCache("favorites");
  return { isFavorited: true };
}

export async function getUserFavorites(userId: string) {
  return db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
    })
    .from(favorites)
    .innerJoin(movies, eq(favorites.movieId, movies.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}
