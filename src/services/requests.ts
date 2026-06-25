import { db } from "@/db";
import { movieRequests, user } from "@/db/schema";
import { eq, desc, and, count, ilike } from "drizzle-orm";

export async function listAdminRequests(args: {
  page: number;
  limit: number;
  status: string | null;
  search: string;
}) {
  const { page, limit, status, search } = args;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (status && (status === "pending" || status === "fulfilled")) {
    conditions.push(eq(movieRequests.status, status));
  }
  if (search) conditions.push(ilike(movieRequests.title, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(movieRequests).where(whereClause),
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
    .where(whereClause)
    .orderBy(desc(movieRequests.createdAt))
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

  return { requests, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createRequest(data: {
  userId: string;
  title: string;
  description?: string | null;
  externalLink?: string | null;
}) {
  const { userId, title, description, externalLink } = data;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return { error: "Title is required" };
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

  if (!updated) return { error: "Request Not Found" };
  return { request: updated };
}

export async function deleteRequest(requestId: number) {
  const [deleted] = await db.delete(movieRequests).where(eq(movieRequests.id, requestId)).returning();
  if (!deleted) return false;
  return true;
}
