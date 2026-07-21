import { db } from "@/db";
import { watchlist, movies } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export async function toggleWatchlist(movieId: number, userId: string) {
  const existing = await db
    .select({ id: watchlist.movieId })
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.movieId, movieId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(watchlist)
      .where(and(eq(watchlist.userId, userId), eq(watchlist.movieId, movieId)));
    return { isInWatchlist: false };
  }

  await db.insert(watchlist).values({ userId, movieId });
  return { isInWatchlist: true };
}

export async function getUserWatchlist(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

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
}
