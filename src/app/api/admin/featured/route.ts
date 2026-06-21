import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { featuredMovies, movies } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";


export async function GET(request: NextRequest) {
  try {
    const session = await getCachedSession(request);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db
      .select({
        id: featuredMovies.id,
        movieId: featuredMovies.movieId,
        displayOrder: featuredMovies.displayOrder,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(featuredMovies)
      .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
      .orderBy(asc(featuredMovies.displayOrder));

    return NextResponse.json({ featured: result });
  } catch {
    return NextResponse.json({ error: "Failed to fetch featured movies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCachedSession(request);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { movieId } = body;

    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }

    const [maxResult] = await db
      .select({ max: sql<number>`COALESCE(MAX(${featuredMovies.displayOrder}), -1)` })
      .from(featuredMovies);

    const nextOrder = (maxResult?.max ?? -1) + 1;

    const [created] = await db
      .insert(featuredMovies)
      .values({ movieId, displayOrder: nextOrder })
      .returning();

    return NextResponse.json({ featured: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: "Movie is already featured" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add featured movie" }, { status: 500 });
  }
}
