import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { featuredMovies, movies, watchHistory, movieTags, tags } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settled = await Promise.allSettled([
      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          description: movies.description,
          releaseDate: movies.releaseDate,
          durationSeconds: movies.durationSeconds,
          thumbnailUrl: movies.thumbnailUrl,
          backdropUrl: movies.backdropUrl,
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

    const featured = settled[0].status === "fulfilled" ? settled[0].value : [];
    const continueWatching = settled[1].status === "fulfilled" ? settled[1].value : [];
    const recentlyAdded = settled[2].status === "fulfilled" ? settled[2].value : [];

    if (featured.length > 0) {
      const featuredIds = featured.map((m) => m.id);
      const tagRows = await db
        .select({ movieId: movieTags.movieId, id: tags.id, name: tags.name })
        .from(movieTags)
        .innerJoin(tags, eq(movieTags.tagId, tags.id))
        .where(inArray(movieTags.movieId, featuredIds));

      const tagsByMovie: Record<number, { id: number; name: string }[]> = {};
      for (const row of tagRows) {
        if (!tagsByMovie[row.movieId]) tagsByMovie[row.movieId] = [];
        tagsByMovie[row.movieId].push({ id: row.id, name: row.name });
      }

      for (const movie of featured) {
        (movie as Record<string, unknown>).tags = tagsByMovie[movie.id] || [];
      }
    }

    return NextResponse.json({ featured, continueWatching, recentlyAdded });
  } catch (e) {
    console.error("api/home error:", e instanceof Error ? e.message : e, e instanceof Error ? e.stack : "");
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
