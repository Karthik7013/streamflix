import { db } from "@/db";
import { movies, videoReports, movieRequests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getAdminStats() {
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
    growth: growthRows as unknown as { month: string; count: number }[],
  };
}
