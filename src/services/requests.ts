import { db } from "@/db";
import { movieRequests, user } from "@/db/schema";
import { eq, and, count, type SQL } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";

const requestListConfig: AdminListConfig = {
  sortableColumns: {
    title: movieRequests.title,
    status: movieRequests.status,
    createdAt: movieRequests.createdAt,
    updatedAt: movieRequests.updatedAt,
  },
  filterableColumns: {
    title: movieRequests.title,
    description: movieRequests.description,
  },
  searchColumns: [movieRequests.title],
  defaultSortBy: "createdAt",
};

export async function listAdminRequests(args: AdminListParams & { status?: string | null }) {
  const { page, limit, status } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, requestListConfig);
  const conditions: SQL[] = whereClause ? [whereClause] : [];

  if (status && (status === "pending" || status === "fulfilled")) {
    conditions.push(eq(movieRequests.status, status));
  }

  const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(movieRequests).where(finalWhere),
    db
    .select({
      id: movieRequests.id,
      userId: movieRequests.userId,
      title: movieRequests.title,
      description: movieRequests.description,
      externalLink: movieRequests.externalLink,
      status: movieRequests.status,
      createdAt: movieRequests.createdAt,
      updatedAt: movieRequests.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(movieRequests)
    .innerJoin(user, eq(movieRequests.userId, user.id))
    .where(finalWhere)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset)
  ]);
  const total = totalResult[0].total;

  const requests = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    externalLink: r.externalLink,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    user: { name: r.userName, email: r.userEmail },
  }));

  return { data: requests, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
}

export async function createRequest(data: {
  userId: string;
  title: string;
  description?: string | null;
  externalLink?: string | null;
}) {
  const { userId, title, description, externalLink } = data;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return { error: { message: "Title is required", code: "TITLE_REQUIRED" } };
  }

  const [req] = await db
    .insert(movieRequests)
    .values({
      userId,
      title: title.trim(),
      description: description || null,
      externalLink: externalLink || null,
    })
    .returning();


  return { request: req };
}

export async function fulfillRequest(requestId: number) {
  const [updated] = await db
    .update(movieRequests)
    .set({ status: "fulfilled", updatedAt: new Date() })
    .where(eq(movieRequests.id, requestId))
    .returning();

  if (!updated) return { error: { message: "Request Not Found", code: "NOT_FOUND" } };

  return { request: updated };
}

export async function deleteRequest(requestId: number) {
  const [deleted] = await db.delete(movieRequests).where(eq(movieRequests.id, requestId)).returning();
  if (!deleted) return false;

  return true;
}
