import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, movieTags, tags } from "@/db/schema";
import { eq, and, ne, inArray, desc } from "drizzle-orm";

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
    const [movie] = await db
      .select({ id: movies.id })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);

    if (!movie) {
      return NextResponse.json({ related: [] });
    }

    const tagRows = await db
      .select({ id: tags.id })
      .from(movieTags)
      .innerJoin(tags, eq(movieTags.tagId, tags.id))
      .where(eq(movieTags.movieId, movie.id));

    let related: { id: number; title: string; slug: string; thumbnailUrl: string }[] = [];
    if (tagRows.length > 0) {
      const tagIds = tagRows.map((t) => t.id);
      related = await db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
        .where(
          and(
            inArray(movieTags.tagId, tagIds),
            ne(movies.id, movie.id),
          )
        )
        .groupBy(movies.id)
        .orderBy(desc(movies.createdAt))
        .limit(6);
    }

    return NextResponse.json({ related });
  } catch {
    return NextResponse.json({ related: [] });
  }
}
