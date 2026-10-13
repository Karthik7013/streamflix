import { db } from "@/db";
import { movieTags, tags } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { groupBy } from "@/lib/db-utils";

export interface MovieTag {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
}

export async function batchMovieTags(movieIds: number[]): Promise<Map<number, MovieTag[]>> {
  if (movieIds.length === 0) return new Map();
  const rows = await db
    .select({ movieId: movieTags.movieId, id: tags.id, name: tags.name, slug: tags.slug, createdAt: tags.createdAt })
    .from(movieTags)
    .innerJoin(tags, eq(movieTags.tagId, tags.id))
    .where(inArray(movieTags.movieId, movieIds));
  return groupBy(rows, (row) => row.movieId);
}

export async function withMovieTags<T extends { id: number }>(
  rows: T[]
): Promise<(T & { tags: { id: number; name: string; slug: string }[] })[]> {
  const byMovieId = await batchMovieTags(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    tags: (byMovieId.get(r.id) ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
  }));
}
