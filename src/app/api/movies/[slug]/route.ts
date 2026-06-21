import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, favorites, movieTags, tags } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const result = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        videoUrl: movies.videoUrl,
        thumbnailUrl: movies.thumbnailUrl,
        backdropUrl: movies.backdropUrl,
        durationSeconds: movies.durationSeconds,
        releaseDate: movies.releaseDate,
        isFavorited: sql<boolean>`exists(select 1 from ${favorites} where ${eq(favorites.userId, session.user.id)} and ${eq(favorites.movieId, movies.id)})`,
      })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    const movie = result[0];

    const tagRows = await db
      .select({ id: tags.id, name: tags.name })
      .from(movieTags)
      .innerJoin(tags, eq(movieTags.tagId, tags.id))
      .where(eq(movieTags.movieId, movie.id));

    return NextResponse.json({ ...movie, tags: tagRows });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
