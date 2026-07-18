import { db } from "@/db";
import { movies, videoReports } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getAdminStats() {
  const [[{ totalMovies }], [{ published }], [{ draft }], [{ reports }], [{ pendingReports }], growthRows] = await Promise.all([
    db.select({ totalMovies: sql<number>`COUNT(*)` }).from(movies),
    db.select({ published: sql<number>`COUNT(*)` }).from(movies).where(eq(movies.published, true)),
    db.select({ draft: sql<number>`COUNT(*)` }).from(movies).where(eq(movies.published, false)),
    db.select({ reports: sql<number>`COUNT(*)` }).from(videoReports),
    db.select({ pendingReports: sql<number>`COUNT(*)` }).from(videoReports).where(eq(videoReports.status, "pending")),
    db.execute(sql`
      SELECT to_char(created_at, 'Mon YYYY') as month, COUNT(*)::int as count
      FROM movies
      GROUP BY month
      ORDER BY MIN(created_at)
    `),
  ]);

  const pubPct = totalMovies > 0 ? (published / totalMovies) * 100 : 0;
  const draftPct = totalMovies > 0 ? (draft / totalMovies) * 100 : 0;

  return {
    data: [
      { type: "totalMovies", value: totalMovies },
      { type: "published", value: published, subtitle: `${pubPct.toFixed(1)}%`, percent: Math.round(pubPct) },
      { type: "draft", value: draft, subtitle: `${draftPct.toFixed(1)}%`, percent: Math.round(draftPct) },
      { type: "reports", value: reports, subtitle: `${pendingReports} pending` },
    ],
    growth: growthRows as unknown as { month: string; count: number }[],
  };
}
