import { db } from "@/db";
import { videoReports, user, movies } from "@/db/schema";
import { eq, and, asc, desc, count, ilike } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

const reportSortableColumns: Record<string, any> = {
  createdAt: videoReports.createdAt,
  updatedAt: videoReports.updatedAt,
  status: videoReports.status,
};

const reportFilterableColumns: Record<string, any> = {
  description: videoReports.description,
};

export async function createReport(movieId: number, userId: string, description: string) {
  const [report] = await db
    .insert(videoReports)
    .values({ movieId, userId, description })
    .returning();
  invalidateCache("reports");
  return report;
}

export async function listAdminReports(args: {
  page: number;
  limit: number;
  status?: string | null;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  columnFilters?: Record<string, string>;
}) {
  const { page, limit, status, search, sortBy, sortDir, columnFilters = {} } = args;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (status && (status === "pending" || status === "resolved")) {
    conditions.push(eq(videoReports.status, status));
  }
  if (search) conditions.push(ilike(videoReports.description, `%${search}%`));

  for (const [col, val] of Object.entries(columnFilters)) {
    const columnRef = reportFilterableColumns[col];
    if (columnRef && val) {
      conditions.push(ilike(columnRef, `%${val}%`));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn = reportSortableColumns[sortBy || ""] || videoReports.createdAt;
  const orderBy = sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(videoReports).where(whereClause),
    db
      .select({
        id: videoReports.id,
        movieId: videoReports.movieId,
        userId: videoReports.userId,
        description: videoReports.description,
        status: videoReports.status,
        createdAt: videoReports.createdAt,
        updatedAt: videoReports.updatedAt,
        movieTitle: movies.title,
        movieSlug: movies.slug,
        userName: user.name,
        userEmail: user.email,
      })
      .from(videoReports)
      .innerJoin(movies, eq(videoReports.movieId, movies.id))
      .innerJoin(user, eq(videoReports.userId, user.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalResult[0].total;
  const reports = rows.map((r) => ({
    id: r.id,
    movieId: r.movieId,
    userId: r.userId,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    movie: { title: r.movieTitle, slug: r.movieSlug },
    user: { name: r.userName, email: r.userEmail },
  }));

  return { reports, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updateReportStatus(reportId: number, status: "pending" | "resolved") {
  const [updated] = await db
    .update(videoReports)
    .set({ status, updatedAt: new Date() })
    .where(eq(videoReports.id, reportId))
    .returning();
  if (!updated) return { error: "Report Not Found" };
  invalidateCache("reports");
  return { report: updated };
}

export async function deleteReport(reportId: number) {
  const [deleted] = await db
    .delete(videoReports)
    .where(eq(videoReports.id, reportId))
    .returning();
  if (!deleted) return false;
  invalidateCache("reports");
  return true;
}
