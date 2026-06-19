import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, movieTags, tags } from "@/db/schema";
import { eq, ilike, and, desc, count } from "drizzle-orm";


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (search) {
      conditions.push(ilike(movies.title, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(movies)
      .where(whereClause);

    const total = totalResult.total;

    const moviesList = await db
      .select()
      .from(movies)
      .where(whereClause)
      .orderBy(desc(movies.createdAt))
      .limit(limit)
      .offset(offset);

    const settled = await Promise.allSettled(
      moviesList.map(async (movie) => {
        const movieTagRows = await db
          .select({ tag: tags })
          .from(movieTags)
          .innerJoin(tags, eq(movieTags.tagId, tags.id))
          .where(eq(movieTags.movieId, movie.id));

        return {
          ...movie,
          tags: movieTagRows.map((r) => r.tag),
        };
      })
    );

    const moviesWithTags = moviesList.map((movie, i) => {
      const r = settled[i];
      return r.status === "fulfilled" ? r.value : { ...movie, tags: [] };
    });

    return NextResponse.json({
      movies: moviesWithTags,
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
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, description, videoUrl, thumbnailUrl, backdropUrl, durationSeconds, releaseDate, tagIds } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields: title, slug" }, { status: 400 });
    }

    const [createdMovie] = await db
      .insert(movies)
      .values({
        title,
        slug,
        description: description || null,
        videoUrl: videoUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        backdropUrl: backdropUrl || null,
        durationSeconds: durationSeconds || null,
        releaseDate: releaseDate || null,
      })
      .returning();

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(movieTags).values(
        tagIds.map((tagId: number) => ({
          movieId: createdMovie.id,
          tagId,
        }))
      );
    }

    return NextResponse.json(createdMovie, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Create Failed" }, { status: 500 });
  }
}
