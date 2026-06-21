import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, watchHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const continueWatching = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
        progressSeconds: watchHistory.progressSeconds,
        durationSeconds: movies.durationSeconds,
      })
      .from(watchHistory)
      .innerJoin(movies, eq(watchHistory.movieId, movies.id))
      .where(
        and(
          eq(watchHistory.userId, session.user.id),
          eq(watchHistory.isCompleted, false)
        )
      )
      .orderBy(desc(watchHistory.watchedAt))
      .limit(10);

    return NextResponse.json({ continueWatching });
  } catch (e) {
    console.error("api/home/continue-watching error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
