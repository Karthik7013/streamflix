import { db } from "@/db";
import { movies, videoReports, movieRequests, watchlist } from "@/db/schema";
import { eq, sql, count, desc } from "drizzle-orm";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export const TOP_FAVORITES_LIMIT = 5;

export async function getMostFavorited(limit = TOP_FAVORITES_LIMIT) {
  return cacheGetOrSet(`admin:most-favorited:${limit}`, CACHE_TTL.SLOW, async () => {
    return db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
        favCount: count(watchlist.movieId),
      })
      .from(movies)
      .innerJoin(watchlist, eq(movies.id, watchlist.movieId))
      .where(eq(movies.published, true))
      .groupBy(movies.id)
      .orderBy(desc(count(watchlist.movieId)))
      .limit(limit);
  });
}

export async function getAdminStats() {
  return cacheGetOrSet("admin:stats", CACHE_TTL.SLOW, async () => {
    const [[{ totalMovies, published }], [{ reports, pendingReports }], [{ requested }], growthRows] = await Promise.all([
      db.select({
        totalMovies: sql<number>`COUNT(*)`,
        published: sql<number>`COUNT(*) FILTER (WHERE ${eq(movies.published, true)})`,
      }).from(movies),
      db.select({
        reports: sql<number>`COUNT(*)`,
        pendingReports: sql<number>`COUNT(*) FILTER (WHERE ${eq(videoReports.status, 'pending')})`,
      }).from(videoReports),
      db.select({
        requested: sql<number>`COUNT(*) FILTER (WHERE ${eq(movieRequests.status, 'pending')})`,
      }).from(movieRequests),
      db.execute(sql`
        SELECT to_char(created_at, 'Mon YYYY') as month, COUNT(*)::int as count
        FROM movies
        GROUP BY month
        ORDER BY MIN(created_at)
      `),
    ]);

    return {
      data: [
        { type: "totalMovies", value: totalMovies },
        { type: "published", value: published },
        { type: "requested", value: requested },
        { type: "reports", value: reports, subtitle: `${pendingReports} pending` },
      ],
      growth: growthRows.map((r) => ({ month: String(r.month), count: Number(r.count) })),
    };
  });
}
