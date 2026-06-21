import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { watchHistory, movies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";


export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const items = await db
      .select({
        id: watchHistory.id,
        movieId: watchHistory.movieId,
        progressSeconds: watchHistory.progressSeconds,
        isCompleted: watchHistory.isCompleted,
        watchedAt: watchHistory.watchedAt,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
        durationSeconds: movies.durationSeconds,
      })
      .from(watchHistory)
      .innerJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(eq(watchHistory.userId, session.user.id))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: db.$count(watchHistory, eq(watchHistory.userId, session.user.id)) })
      .from(watchHistory)
      .where(eq(watchHistory.userId, session.user.id));

    return NextResponse.json({ items, total: count, offset, limit });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .delete(watchHistory)
      .where(eq(watchHistory.userId, session.user.id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
