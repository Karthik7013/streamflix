import { db } from "@/db";
import { watchlist, movies } from "@/db/schema";
import { eq, and, desc, or, lt } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL, invalidateCache } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { encodeCursor, decodeCursor } from "@/lib/cursor";

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

export async function getUserWatchlist(userId: string, cursor: string | undefined, limit = 20) {
  return cacheGetOrSet(cacheKeys.watchlist(userId, cursor, limit), CACHE_TTL.FAST, async () => {
    const c = decodeCursor<{ c: string; m: number }>(cursor);
    const cursorDate = c ? new Date(c.c) : undefined;
    const cursorWhere = c && cursorDate && !isNaN(cursorDate.getTime())
      ? or(
        lt(watchlist.createdAt, cursorDate),
        and(eq(watchlist.createdAt, cursorDate), lt(watchlist.movieId, c.m))
      )
      : undefined;

    const where = and(
      eq(watchlist.userId, userId),
      eq(movies.published, true),
      ...(cursorWhere ? [cursorWhere] : [])
    );

    const movieRows = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
        createdAt: watchlist.createdAt,
        movieId: watchlist.movieId,
      })
      .from(watchlist)
      .innerJoin(movies, eq(watchlist.movieId, movies.id))
      .where(where)
      .orderBy(desc(watchlist.createdAt), desc(watchlist.movieId))
      .limit(limit + 1);

    const hasMore = movieRows.length > limit;
    const pageRows = hasMore ? movieRows.slice(0, limit) : movieRows;
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasMore && last
      ? encodeCursor({ c: last.createdAt.toISOString(), m: last.movieId })
      : null;

    const data = pageRows.map(({ createdAt: _createdAt, movieId: _movieId, ...movie }) => movie);
    return { data, nextCursor, hasMore };
  });
}
