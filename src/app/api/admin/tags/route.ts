import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { tags, movieTags } from "@/db/schema";
import { eq, like, count } from "drizzle-orm";


export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (search) {
      conditions.push(like(tags.name, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? conditions[0] : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(tags)
      .where(whereClause);

    const total = totalResult.total;

    const tagsList = await db
      .select({
        id: tags.id,
        name: tags.name,
        createdAt: tags.createdAt,
        movieCount: count(movieTags.movieId),
      })
      .from(tags)
      .leftJoin(movieTags, eq(tags.id, movieTags.tagId))
      .where(whereClause)
      .groupBy(tags.id)
      .orderBy(tags.name)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      tags: tagsList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
    }

    const trimmedName = name.trim();

    const [createdTag] = await db
      .insert(tags)
      .values({ name: trimmedName })
      .returning();

    return NextResponse.json(createdTag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create Failed" }, { status: 500 });
  }
}
