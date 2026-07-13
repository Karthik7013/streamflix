import { db } from "@/db";
import { videoReports, user, movies } from "@/db/schema";
import { eq, and, count, type SQL } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";

const reportListConfig: AdminListConfig = {
  sortableColumns: {
    createdAt: videoReports.createdAt,
    updatedAt: videoReports.updatedAt,
    status: videoReports.status,
  },
  filterableColumns: {
    description: videoReports.description,
  },
  searchColumns: [videoReports.description],
  defaultSortBy: "createdAt",
};

export async function createReport(movieId: number, userId: string, description: string) {
  if (!description || typeof description !== "string" || description.trim().length === 0) {
    return { error: { message: "Description is required", code: "DESCRIPTION_REQUIRED" } };
  }

  const [report] = await db
    .insert(videoReports)
    .values({ movieId, userId, description: description.trim() })
    .returning();
  invalidateCache("reports");
  return { report };
}

export async function listAdminReports(args: AdminListParams & { status?: string | null }) {
  const { page, limit, status } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, reportListConfig);
  const conditions: SQL[] = whereClause ? [whereClause] : [];

  if (status && (status === "pending" || status === "resolved")) {
    conditions.push(eq(videoReports.status, status));
  }

  const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(videoReports).where(finalWhere),
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
      .where(finalWhere)
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

  return { data: reports, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
}

export async function updateReportStatus(reportId: number, status: "pending" | "resolved") {
  const [updated] = await db
    .update(videoReports)
    .set({ status, updatedAt: new Date() })
    .where(eq(videoReports.id, reportId))
    .returning();
  if (!updated) return { error: { message: "Report Not Found", code: "NOT_FOUND" } };
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
