import { db } from "@/db";
import { people, movieCredits, movies } from "@/db/schema";
import { eq, and, count, or, gt, asc, inArray, sql } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/list-query";
import { cacheGetOrSet, CACHE_TTL, invalidateCache } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import { ErrorCode } from "@/lib/api-errors";
import { generateSlug } from "@/lib/format";
import { logger } from "@/lib/logger";
import { getTMDBPersonDetails, getTMDBMovieCredits, tmdbImageUrl } from "@/services/tmdb";

async function ensureUniquePersonSlug(base: string, excludeId?: number): Promise<string> {
  let candidate = base;
  let n = 1;
  for (;;) {
    const q = eq(people.slug, candidate);
    const conflict = excludeId
      ? await db.select({ id: people.id }).from(people).where(and(q, sql`${people.id} != ${excludeId}`)).limit(1)
      : await db.select({ id: people.id }).from(people).where(q).limit(1);
    if (conflict.length === 0) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

async function invalidatePeopleCaches() {
  await invalidateCache("people");
  await invalidateCache("movie-credits");
  await invalidateCache("movie-detail");
  await invalidateCache("home");
}

const personListConfig: AdminListConfig = {
  sortableColumns: {
    name: people.name,
    createdAt: people.createdAt,
  },
  filterableColumns: {
    name: people.name,
  },
  searchColumns: [people.name],
  defaultSortBy: "name",
};

interface PersonMovieCursor {
  t: string;
  id: number;
}

export async function getAllPeople() {
  const rows = await cacheGetOrSet(cacheKeys.peopleAll, CACHE_TTL.SLOW, () =>
    db.select({
      id: people.id,
      name: people.name,
      slug: people.slug,
      profileUrl: people.profileUrl,
      createdAt: people.createdAt,
    }).from(people)
  );
  return rows.map((p) => ({ ...p, profileUrl: sanitizeImageUrl(p.profileUrl) }));
}

export async function listAdminPeople(args: AdminListParams) {
  const { page, limit } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, personListConfig);

  const [totalResult, peopleList] = await Promise.all([
    db.select({ total: count() }).from(people).where(whereClause),
    db
      .select({
        id: people.id,
        name: people.name,
        slug: people.slug,
        tmdbId: people.tmdbId,
        profileUrl: people.profileUrl,
        knownForDepartment: people.knownForDepartment,
        createdAt: people.createdAt,
      })
      .from(people)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);
  const total = totalResult[0].total;

  const personIds = peopleList.map((p) => p.id);
  const movieCounts: Record<number, number> = {};
  if (personIds.length > 0) {
    const counts = await db
      .select({
        personId: movieCredits.personId,
        value: count(),
      })
      .from(movieCredits)
      .where(inArray(movieCredits.personId, personIds))
      .groupBy(movieCredits.personId);
    for (const c of counts) {
      movieCounts[c.personId] = Number(c.value);
    }
  }

  const peopleWithCount = peopleList.map((p) => ({
    ...p,
    profileUrl: sanitizeImageUrl(p.profileUrl),
    movieCount: movieCounts[p.id] || 0,
  }));

  return { data: peopleWithCount, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
}

export async function createPerson(data: {
  name: string;
  tmdbId?: number | null;
  profileUrl?: string | null;
  biography?: string | null;
  birthday?: string | null;
  deathday?: string | null;
  gender?: number | null;
  knownForDepartment?: string | null;
  popularity?: number | null;
}) {
  const { name, tmdbId, profileUrl, biography, birthday, deathday, gender, knownForDepartment, popularity } = data;
  const slug = await ensureUniquePersonSlug(generateSlug(name.trim()));
  const [createdPerson] = await db.insert(people).values({
    name: name.trim(),
    slug,
    tmdbId: tmdbId ?? null,
    profileUrl: sanitizeImageUrl(profileUrl),
    biography: biography ?? null,
    birthday: birthday ?? null,
    deathday: deathday ?? null,
    gender: gender ?? null,
    knownForDepartment: knownForDepartment ?? null,
    popularity: popularity ?? null,
  }).returning();
  await invalidatePeopleCaches();
  return createdPerson;
}

export async function updatePerson(personId: number, data: {
  name?: string;
  tmdbId?: number | null;
  profileUrl?: string | null;
  biography?: string | null;
  birthday?: string | null;
  deathday?: string | null;
  gender?: number | null;
  knownForDepartment?: string | null;
  popularity?: number | null;
}) {
  const { name, tmdbId, profileUrl, biography, birthday, deathday, gender, knownForDepartment, popularity } = data;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return { error: { message: "Invalid name", code: ErrorCode.ValidationError } };
    updates.name = name.trim();
    updates.slug = await ensureUniquePersonSlug(generateSlug(name.trim()), personId);
  }
  if (tmdbId !== undefined) updates.tmdbId = tmdbId;
  if (profileUrl !== undefined) updates.profileUrl = sanitizeImageUrl(profileUrl);
  if (biography !== undefined) updates.biography = biography;
  if (birthday !== undefined) updates.birthday = birthday;
  if (deathday !== undefined) updates.deathday = deathday;
  if (gender !== undefined) updates.gender = gender;
  if (knownForDepartment !== undefined) updates.knownForDepartment = knownForDepartment;
  if (popularity !== undefined) updates.popularity = popularity;

  if (Object.keys(updates).length > 0) {
    try {
      const [updatedPerson] = await db
        .update(people)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(people.id, personId))
        .returning();
      if (updatedPerson) {
        await invalidatePeopleCaches();
        return { data: updatedPerson };
      }
    } catch (err) {
      logger.error("people", "Failed to update person", err);
      return { error: { message: "Failed to update person", code: ErrorCode.InternalError } };
    }
  }

  try {
    const [existingPerson] = await db.select().from(people).where(eq(people.id, personId)).limit(1);
    if (!existingPerson) return { error: { message: "Person Not Found", code: ErrorCode.NotFound } };
    return { data: existingPerson };
  } catch (err) {
    logger.error("people", "Failed to fetch person after update fallback", err);
    return { error: { message: "Failed to update person", code: ErrorCode.InternalError } };
  }
}

export async function deletePerson(personId: number) {
  await db.delete(movieCredits).where(eq(movieCredits.personId, personId));
  await db.delete(people).where(eq(people.id, personId));
  await invalidatePeopleCaches();
  return true;
}

export async function getPersonBySlug(slug: string) {
  const person = await cacheGetOrSet(cacheKeys.person(slug), CACHE_TTL.SLOW, async () => {
    const [row] = await db
      .select({
        id: people.id,
        name: people.name,
        slug: people.slug,
        tmdbId: people.tmdbId,
        profileUrl: people.profileUrl,
        biography: people.biography,
        birthday: people.birthday,
        deathday: people.deathday,
        gender: people.gender,
        knownForDepartment: people.knownForDepartment,
        popularity: people.popularity,
        createdAt: people.createdAt,
        updatedAt: people.updatedAt,
      })
      .from(people)
      .where(eq(people.slug, slug))
      .limit(1);
    return row ?? null;
  });
  return person ? { ...person, profileUrl: sanitizeImageUrl(person.profileUrl) } : null;
}

export async function getCreditsByMovie(movieId: number) {
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
      tmdbId: people.tmdbId,
      knownForDepartment: people.knownForDepartment,
    })
    .from(movieCredits)
    .innerJoin(people, eq(movieCredits.personId, people.id))
    .where(eq(movieCredits.movieId, movieId));

  const cast = rows
    .filter((r) => r.roleType === "cast")
    .sort((a, b) => {
      const ra = a.creditOrder ?? Number.MAX_SAFE_INTEGER;
      const rb = b.creditOrder ?? Number.MAX_SAFE_INTEGER;
      return ra - rb;
    }).map((r) => ({
      id: r.id,
      movieId: r.movieId,
      personId: r.personId,
      roleType: r.roleType as "cast" | "crew",
      department: r.department,
      job: r.job,
      character: r.character,
      creditOrder: r.creditOrder,
      person: {
        id: r.personId,
        name: r.name,
        slug: r.slug,
        profileUrl: r.profileUrl,
        tmdbId: r.tmdbId,
        knownForDepartment: r.knownForDepartment,
      },
    }));
  const crew = rows
    .filter((r) => r.roleType === "crew")
    .map((r) => ({
      id: r.id,
      movieId: r.movieId,
      personId: r.personId,
      roleType: r.roleType as "cast" | "crew",
      department: r.department,
      job: r.job,
      character: r.character,
      creditOrder: r.creditOrder,
      person: {
        id: r.personId,
        name: r.name,
        slug: r.slug,
        profileUrl: r.profileUrl,
        tmdbId: r.tmdbId,
        knownForDepartment: r.knownForDepartment,
      },
    }));

  return { cast, crew };
}

export async function deleteMovieCredit(creditId: number) {
  const [credit] = await db.select().from(movieCredits).where(eq(movieCredits.id, creditId)).limit(1);
  if (!credit) return false;
  const movieId = credit.movieId;
  await db.delete(movieCredits).where(eq(movieCredits.id, creditId));
  await invalidatePeopleCaches();
  return { movieId };
}

export async function upsertPersonFromTmdb(tmdbId: number) {
  const existing = await db.select({ id: people.id, tmdbId: people.tmdbId }).from(people).where(eq(people.tmdbId, tmdbId)).limit(1);
  if (existing.length > 0) return existing[0];

  const d = await getTMDBPersonDetails(tmdbId);
  const [person] = await db.insert(people).values({
    name: d.name,
    slug: await ensureUniquePersonSlug(generateSlug(d.name)),
    tmdbId: d.id,
    profileUrl: tmdbImageUrl(d.profile_path),
    biography: d.biography,
    birthday: d.birthday,
    deathday: d.deathday,
    gender: d.gender,
    knownForDepartment: d.known_for_department,
    popularity: d.popularity,
  }).returning();
  await invalidatePeopleCaches();
  return person;
}

type ImportCreditsResult =
  | { error: { message: string; code: ErrorCode } }
  | { imported: number; processed: number; movieId: number; title: string };

export async function importCreditsForMovie(movieId: number): Promise<ImportCreditsResult> {
  const [movie] = await db.select({ id: movies.id, tmdbId: movies.tmdbId, title: movies.title }).from(movies).where(eq(movies.id, movieId)).limit(1);
  if (!movie) return { error: { message: "Movie Not Found", code: ErrorCode.NotFound } };
  if (!movie.tmdbId) return { error: { message: "Movie has no TMDB ID", code: ErrorCode.ValidationError } };

  const credits = await getTMDBMovieCredits(movie.tmdbId);
  let imported = 0;

  const processCredit = async (c: typeof credits.cast[number], roleType: "cast" | "crew") => {
    const person = await upsertPersonFromTmdb(c.id);
    const [existing] = await db.select({ id: movieCredits.id }).from(movieCredits)
      .where(and(eq(movieCredits.movieId, movieId), eq(movieCredits.personId, person.id), eq(movieCredits.roleType, roleType))).limit(1);
    if (existing) return;
    await db.insert(movieCredits).values({
      movieId,
      personId: person.id,
      roleType,
      department: c.department ?? null,
      job: c.job ?? null,
      character: c.character ?? null,
      creditOrder: c.order ?? null,
    });
    imported += 1;
  };

  for (const c of credits.cast) await processCredit(c, "cast");
  for (const c of credits.crew) await processCredit(c, "crew");

  await invalidatePeopleCaches();
  return { imported, processed: credits.cast.length + credits.crew.length, movieId: movie.id, title: movie.title };
}

export async function backfillAllCredits(args: { limit?: number }) {
  const limit = args.limit ?? 50;

  const all = await db
    .select({ id: movies.id, tmdbId: movies.tmdbId })
    .from(movies)
    .where(and(eq(movies.published, true), gt(movies.tmdbId, 0)))
    .limit(limit);

  let processed = 0;
  let imported = 0;
  const errors: string[] = [];

  for (const m of all) {
    try {
      const result = await importCreditsForMovie(m.id);
      if ("error" in result) {
        errors.push(`Movie ${m.id}: ${result.error?.message ?? "Unknown error"}`);
      } else {
        imported += result.imported;
      }
      processed += 1;
    } catch (err) {
      processed += 1;
      errors.push(`Movie ${m.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { processed, imported, errors };
}

export async function getMoviesByPerson(personId: number, cursor: string | undefined, limit: number) {
  const c = decodeCursor<PersonMovieCursor>(cursor);
  const cursorWhere = c
    ? or(gt(movies.title, c.t), and(eq(movies.title, c.t), gt(movies.id, c.id)))
    : undefined;

  const rows = await db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      roleType: movieCredits.roleType,
      job: movieCredits.job,
      character: movieCredits.character,
    })
    .from(movieCredits)
    .innerJoin(movies, eq(movieCredits.movieId, movies.id))
    .where(and(eq(movieCredits.personId, personId), eq(movies.published, true), ...(cursorWhere ? [cursorWhere] : [])))
    .orderBy(asc(movies.title), asc(movies.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const last = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && last ? encodeCursor({ t: last.title, id: last.id }) : null;

  return { data: pageRows, nextCursor, hasMore };
}
