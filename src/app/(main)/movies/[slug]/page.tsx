import { MovieDetailContent } from "./movie-detail-content";
import type { Metadata } from "next";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [movie] = await db
      .select({ title: movies.title })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);
    if (movie) {
      return { title: movie.title };
    }
  } catch {
    // fallback
  }
  return { title: "Movie" };
}

export default async function MoviePage() {
  return <MovieDetailContent />;
}
