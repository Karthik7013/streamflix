import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies, movieTags, tags } from "@/db/schema";
import { eq, ilike, and, desc, count, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
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

    const movieIds = moviesList.map((m) => m.id);

    const tagRows = movieIds.length > 0
      ? await db
          .select({ movieId: movieTags.movieId, id: tags.id, name: tags.name, createdAt: tags.createdAt })
          .from(movieTags)
          .innerJoin(tags, eq(movieTags.tagId, tags.id))
          .where(inArray(movieTags.movieId, movieIds))
      : [];

    const tagsByMovieId: Record<number, typeof tags.$inferSelect[]> = {};
    for (const row of tagRows) {
      if (!tagsByMovieId[row.movieId]) tagsByMovieId[row.movieId] = [];
      tagsByMovieId[row.movieId].push({ id: row.id, name: row.name, createdAt: row.createdAt });
    }

    const moviesWithTags = moviesList.map((movie) => ({
      ...movie,
      tags: tagsByMovieId[movie.id] || [],
    }));

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
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, slug, description, videoUrl, thumbnailUrl, backdropUrl, durationSeconds, releaseDate, tagIds } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields: title, slug" }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug) || slug.length === 0) {
      return NextResponse.json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" }, { status: 400 });
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
