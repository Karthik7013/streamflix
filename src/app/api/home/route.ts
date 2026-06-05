import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { featuredMovies, movies, watchHistory } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [featured, continueWatching, recentlyAdded] = await Promise.all([
      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(featuredMovies)
        .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
        .orderBy(featuredMovies.displayOrder),

      db
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
        .limit(10),

      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .orderBy(desc(movies.createdAt))
        .limit(12),
    ]);

    return NextResponse.json({ featured, continueWatching, recentlyAdded });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
