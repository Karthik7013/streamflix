import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { db } from "@/db";
import { featuredMovies, movies, movieTags, tags } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const featured = await cacheGetOrSet("home:featured", 60, async () => {
      const items = await db
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
        .orderBy(asc(featuredMovies.displayOrder));

      if (items.length > 0) {
        const featuredIds = items.map((m) => m.id);
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

        for (const movie of items) {
          (movie as Record<string, unknown>).tags = tagsByMovie[movie.id] || [];
        }
      }

      return items;
    });

    return NextResponse.json({ featured });
  } catch (e) {
    console.error("api/home/featured error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
