import { db } from "@/db";
import { watchlist, movies } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL, invalidateCache } from "@/lib/cache";

export async function addToWatchlist(movieId: number, userId: string) {
  await db
    .insert(watchlist)
    .values({ userId, movieId })
    .onConflictDoNothing();
  await invalidateCache("watchlist");
  return { isInWatchlist: true };
}

export async function removeFromWatchlist(movieId: number, userId: string) {
  await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.movieId, movieId)));
  await invalidateCache("watchlist");
  return { isInWatchlist: false };
}

export async function getUserWatchlist(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  return cacheGetOrSet(`watchlist:user:${userId}:${page}:${limit}`, CACHE_TTL.FAST, async () => {
    const [movieRows, totalRows] = await Promise.all([
      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(watchlist)
        .innerJoin(movies, eq(watchlist.movieId, movies.id))
        .where(and(eq(watchlist.userId, userId), eq(movies.published, true)))
        .orderBy(desc(watchlist.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: count() })
        .from(watchlist)
        .innerJoin(movies, eq(watchlist.movieId, movies.id))
        .where(and(eq(watchlist.userId, userId), eq(movies.published, true))),
    ]);

    const total = totalRows[0].count;
    return { data: movieRows, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
  });
}
