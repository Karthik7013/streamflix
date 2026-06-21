import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, watchHistory } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const movie = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, slug))
    .limit(1);

  if (movie.length === 0) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  const movieId = movie[0].id;
  const body = await request.json();
  const progressSeconds = body.progressSeconds as number;
  const isCompleted = body.isCompleted as boolean;

  if (typeof progressSeconds !== "number" || progressSeconds < 0) {
    return NextResponse.json({ error: "Invalid progress" }, { status: 400 });
  }

  try {
    await db
      .insert(watchHistory)
      .values({
        userId: session.user.id,
        movieId,
        progressSeconds,
        isCompleted: isCompleted ?? false,
        watchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [watchHistory.userId, watchHistory.movieId],
        set: {
          progressSeconds: sql`EXCLUDED.progress_seconds`,
          isCompleted: sql`EXCLUDED.is_completed`,
          watchedAt: sql`EXCLUDED.watched_at`,
        },
      });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}
