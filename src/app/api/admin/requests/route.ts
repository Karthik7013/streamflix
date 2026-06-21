import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movieRequests, user } from "@/db/schema";
import { eq, desc, and, count, ilike } from "drizzle-orm";


export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (status && (status === "pending" || status === "fulfilled")) {
      conditions.push(eq(movieRequests.status, status));
    }
    if (search) {
      conditions.push(ilike(movieRequests.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(movieRequests)
      .where(whereClause);

    const total = totalResult.total;

    const rows = await db
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
      .offset(offset);

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

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
