import { db } from "@/db";
import { movieCredits, people } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { groupBy } from "@/lib/db-utils";

export interface MovieCreditRow {
  id: number;
  movieId: number;
  personId: number;
  roleType: string;
  department: string | null;
  job: string | null;
  character: string | null;
  creditOrder: number | null;
  personId_?: number;
  name: string;
  slug: string;
  profileUrl: string | null;
  knownForDepartment: string | null;
}

export async function batchMovieCredits(movieIds: number[]): Promise<Map<number, MovieCreditRow[]>> {
  if (movieIds.length === 0) return new Map();
  const rows = await db
    .select({
      id: movieCredits.id,
      movieId: movieCredits.movieId,
      personId: movieCredits.personId,
      roleType: movieCredits.roleType,
      department: movieCredits.department,
      job: movieCredits.job,
      character: movieCredits.character,
      creditOrder: movieCredits.creditOrder,
      name: people.name,
      slug: people.slug,
      profileUrl: people.profileUrl,
      knownForDepartment: people.knownForDepartment,
    })
    .from(movieCredits)
    .innerJoin(people, eq(movieCredits.personId, people.id))
    .where(inArray(movieCredits.movieId, movieIds));
  return groupBy(rows, (row) => row.movieId);
}

export async function withMovieCredits<T extends { id: number }>(
  rows: T[]
): Promise<(T & { credits: MovieCreditRow[] })[]> {
  const byMovieId = await batchMovieCredits(rows.map((r) => r.id));
  return rows.map((r) => ({
    ...r,
    credits: (byMovieId.get(r.id) ?? []).sort((a, b) => {
      const ra = a.creditOrder ?? Number.MAX_SAFE_INTEGER;
      const rb = b.creditOrder ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    }),
  }));
}
