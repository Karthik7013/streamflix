import { NextResponse } from "next/server";
import { db } from "@/db";
import { movies, favorites } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const mostFavorited = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
        favCount: count(favorites.movieId),
      })
      .from(movies)
      .innerJoin(favorites, eq(movies.id, favorites.movieId))
      .groupBy(movies.id)
      .orderBy(desc(count(favorites.movieId)))
      .limit(5);

    return NextResponse.json({ mostFavorited });
  } catch (e) {
    console.error("api/admin/most-favorited error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
