import { db } from "@/db";
import { movies, movieTags, tags, favorites } from "@/db/schema";
import { eq, and, ne, inArray, asc, desc, ilike, sql, count } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { deleteFromIA } from "@/lib/upload-utils";
import { buildIAUrl } from "@/lib/upload-utils";
import { validateSlug, validateDuration } from "@/lib/validation";

interface MovieRow {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

interface MovieDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  trailerUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  tags: { id: number; name: string }[];
  isFavorited?: boolean;
}

export async function getMovieBySlug(slug: string) {
  const [movieResult, tagRows] = await Promise.all([
    db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        videoUrl: movies.videoUrl,
        thumbnailUrl: movies.thumbnailUrl,
        backdropUrl: movies.backdropUrl,
        trailerUrl: movies.trailerUrl,
        durationSeconds: movies.durationSeconds,
        releaseDate: movies.releaseDate,
      })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1),
    db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .innerJoin(movieTags, eq(tags.id, movieTags.tagId))
      .innerJoin(movies, eq(movieTags.movieId, movies.id))
      .where(eq(movies.slug, slug)),
  ]);

  if (movieResult.length === 0) return null;

  return { ...movieResult[0], tags: tagRows };
}

export async function checkFavorite(movieId: number, userId: string) {
  const [favorited] = await db
    .select({ isFavorited: sql<boolean>`true` })
    .from(favorites)
    .where(
      sql`${eq(favorites.userId, userId)} and ${eq(favorites.movieId, movieId)}`
    )
    .limit(1);
  return !!favorited;
}

export async function getRelatedMovies(slug: string) {
  const [movieResult, tagRows] = await Promise.all([
    db
      .select({ id: movies.id })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1),
    db
      .select({ id: tags.id })
      .from(tags)
      .innerJoin(movieTags, eq(tags.id, movieTags.tagId))
      .innerJoin(movies, eq(movieTags.movieId, movies.id))
      .where(eq(movies.slug, slug)),
  ]);

  if (movieResult.length === 0) return [];
  const movie = movieResult[0];

  if (tagRows.length === 0) return [];

  const tagIds = tagRows.map((t) => t.id);
  return db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
    })
    .from(movies)
    .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
    .where(and(inArray(movieTags.tagId, tagIds), ne(movies.id, movie.id)))
    .groupBy(movies.id)
    .orderBy(desc(movies.createdAt))
    .limit(6);
}

export async function attachTags(rows: MovieRow[]) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const tagRows = await db
    .select({ movieId: movieTags.movieId, tagId: tags.id, tagName: tags.name })
    .from(movieTags)
    .innerJoin(tags, eq(movieTags.tagId, tags.id))
    .where(inArray(movieTags.movieId, ids));
  const tagMap = new Map<number, { id: number; name: string }[]>();
  for (const t of tagRows) {
    if (!tagMap.has(t.movieId)) tagMap.set(t.movieId, []);
    tagMap.get(t.movieId)!.push({ id: t.tagId, name: t.tagName });
  }
  return rows.map((r) => ({ ...r, tags: tagMap.get(r.id) || [] }));
}

export async function searchMovies(args: {
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  const { q, tagsParam, page = 1, limit = 12, sortBy = "createdAt", sortDir = "desc" } = args;
  const offset = (page - 1) * limit;

  const sortCol = movieSortableColumns[sortBy] || movies.createdAt;
  const orderDir = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const conditions: any[] = [];
  if (q) conditions.push(ilike(movies.title, `%${q}%`));

  if (tagsParam) {
    const tagIds = tagsParam.split(",").map(Number);
    try {
      const [movieRows, totalRows] = await Promise.all([
        db
          .select({
            id: movies.id,
            title: movies.title,
            slug: movies.slug,
            thumbnailUrl: movies.thumbnailUrl,
          })
          .from(movies)
          .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
          .where(
            conditions.length > 0
              ? and(...conditions, inArray(movieTags.tagId, tagIds))
              : inArray(movieTags.tagId, tagIds)
          )
          .groupBy(movies.id)
          .having(sql`count(distinct ${movieTags.tagId}) = ${tagIds.length}`)
          .orderBy(orderDir)
          .limit(limit)
          .offset(offset),
        db
          .select({ value: count() })
          .from(
            db
              .select({ id: movies.id })
              .from(movies)
              .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
              .where(
                conditions.length > 0
                  ? and(...conditions, inArray(movieTags.tagId, tagIds))
                  : inArray(movieTags.tagId, tagIds)
              )
              .groupBy(movies.id)
              .having(sql`count(distinct ${movieTags.tagId}) = ${tagIds.length}`)
              .as("filtered")
          ),
      ]);
      const result = await attachTags(movieRows);
      return { movies: result, total: totalRows[0].value };
    } catch (err) {
      console.error("[searchMovies] DB error:", err);
      return { movies: [], total: 0 };
    }
  }

  try {
    const [movieRows, totalRows] = await Promise.all([
      db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderDir)
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(movies).where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);
    const result = await attachTags(movieRows);
    return { movies: result, total: totalRows[0].value };
  } catch (err) {
    console.error("[searchMovies] DB error:", err);
    return { movies: [], total: 0 };
  }
}

export async function createMovie(data: {
  title: string;
  slug: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string;
  backdropUrl?: string | null;
  trailerUrl?: string | null;
  durationSeconds?: number | null;
  releaseDate?: string | null;
  tagIds?: number[];
  tmdbId?: number | null;
  originalLanguage?: string | null;
}) {
  const { title, slug, description, videoUrl, thumbnailUrl, backdropUrl, trailerUrl, durationSeconds, releaseDate, tagIds, tmdbId, originalLanguage } = data;

  const computedVideoUrl = videoUrl || (releaseDate
    ? buildIAUrl(`movies/${new Date(releaseDate).getFullYear()}/${slug}/videos/movie.mp4`)
    : null);

  const [createdMovie] = await db
    .insert(movies)
    .values({
      title,
      slug,
      description: description ?? null,
      videoUrl: computedVideoUrl,
      thumbnailUrl: thumbnailUrl ?? "",
      backdropUrl: backdropUrl ?? null,
      trailerUrl: trailerUrl ?? null,
      durationSeconds: durationSeconds ?? null,
      releaseDate: releaseDate ?? null,
      tmdbId: tmdbId ?? null,
      originalLanguage: originalLanguage ?? null,
    })
    .returning();

  if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
    await db.insert(movieTags).values(tagIds.map((tagId) => ({ movieId: createdMovie.id, tagId })));
  }

  invalidateCache("movies-list");
  return createdMovie;
}

export async function updateMovie(
  movieId: number,
  data: {
    title?: string;
    slug?: string;
    description?: string | null;
    videoUrl?: string | null;
    thumbnailUrl?: string;
    backdropUrl?: string | null;
    trailerUrl?: string | null;
    durationSeconds?: number | null;
    releaseDate?: string | null;
    tagIds?: number[];
    tmdbId?: number | null;
    originalLanguage?: string | null;
  }
) {
  const { title, slug, description, videoUrl, thumbnailUrl, backdropUrl, trailerUrl, durationSeconds, releaseDate, tagIds, tmdbId, originalLanguage } = data;

  const [existingMovie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
  if (!existingMovie) return null;

  const oldUrls: string[] = [];
  if (videoUrl !== undefined && existingMovie.videoUrl && videoUrl !== existingMovie.videoUrl)
    oldUrls.push(existingMovie.videoUrl);
  if (thumbnailUrl !== undefined && existingMovie.thumbnailUrl && thumbnailUrl !== existingMovie.thumbnailUrl)
    oldUrls.push(existingMovie.thumbnailUrl);
  if (backdropUrl !== undefined && existingMovie.backdropUrl && backdropUrl !== existingMovie.backdropUrl)
    oldUrls.push(existingMovie.backdropUrl);

  const updateData: Partial<typeof movies.$inferInsert> & { updatedAt?: Date } = {};
  if (title !== undefined) updateData.title = title;
  if (slug !== undefined) updateData.slug = slug;
  if (description !== undefined) updateData.description = description;
  if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
  if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
  if (backdropUrl !== undefined) updateData.backdropUrl = backdropUrl;
  if (trailerUrl !== undefined) updateData.trailerUrl = trailerUrl;
  if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds;
  if (releaseDate !== undefined) updateData.releaseDate = releaseDate;
  if (tmdbId !== undefined) updateData.tmdbId = tmdbId;
  if (originalLanguage !== undefined) updateData.originalLanguage = originalLanguage;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    const [updatedMovie] = await db.update(movies).set(updateData).where(eq(movies.id, movieId)).returning();

    if (oldUrls.length > 0) {
      Promise.allSettled(oldUrls.map((url) => deleteFromIA(url)));
    }

    if (tagIds && Array.isArray(tagIds)) {
      await db.delete(movieTags).where(eq(movieTags.movieId, movieId));
      if (tagIds.length > 0) {
        await db.insert(movieTags).values(tagIds.map((tagId) => ({ movieId, tagId })));
      }
    }

    invalidateCache("movies-list");
    return updatedMovie;
  }

  if (tagIds && Array.isArray(tagIds)) {
    await db.delete(movieTags).where(eq(movieTags.movieId, movieId));
    if (tagIds.length > 0) {
      await db.insert(movieTags).values(tagIds.map((tagId) => ({ movieId, tagId })));
    }
  }

  invalidateCache("movies-list");
  return existingMovie;
}

export async function deleteMovie(movieId: number) {
  const [movie] = await db
    .select({ videoUrl: movies.videoUrl, thumbnailUrl: movies.thumbnailUrl, backdropUrl: movies.backdropUrl })
    .from(movies)
    .where(eq(movies.id, movieId))
    .limit(1);
  if (!movie) return false;

  const urlsToDelete = [movie.videoUrl, movie.thumbnailUrl, movie.backdropUrl].filter(Boolean) as string[];

  await Promise.all([
    Promise.allSettled(urlsToDelete.map((url) => deleteFromIA(url))),
    db.delete(movieTags).where(eq(movieTags.movieId, movieId)),
    db.delete(movies).where(eq(movies.id, movieId)),
  ]);

  invalidateCache("movies-list");
  return true;
}

const movieSortableColumns: Record<string, any> = {
  id: movies.id,
  title: movies.title,
  createdAt: movies.createdAt,
  durationSeconds: movies.durationSeconds,
  releaseDate: movies.releaseDate,
  updatedAt: movies.updatedAt,
};

const movieFilterableColumns: Record<string, any> = {
  title: movies.title,
  slug: movies.slug,
  description: movies.description,
};

export async function listAdminMovies(args: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  columnFilters?: Record<string, string>;
}) {
  const { page, limit, search, sortBy, sortDir, columnFilters = {} } = args;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (search) conditions.push(ilike(movies.title, `%${search}%`));

  for (const [col, val] of Object.entries(columnFilters)) {
    const columnRef = movieFilterableColumns[col];
    if (columnRef && val) {
      conditions.push(ilike(columnRef, `%${val}%`));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = movieSortableColumns[sortBy || ''] || movies.createdAt;
  const orderBy = sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn);

  const [totalResult] = await db.select({ total: count() }).from(movies).where(whereClause);
  const total = totalResult.total;

  const moviesList = await db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      durationSeconds: movies.durationSeconds,
      releaseDate: movies.releaseDate,
      createdAt: movies.createdAt,
      updatedAt: movies.updatedAt,
    })
    .from(movies)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const movieIds = moviesList.map((m) => m.id);
  const tagRows =
    movieIds.length > 0
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

  const moviesWithTags = moviesList.map((movie) => ({ ...movie, tags: tagsByMovieId[movie.id] || [] }));

  return {
    movies: moviesWithTags,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export { validateSlug, validateDuration };

export function movieDetailToResponse(movie: NonNullable<Awaited<ReturnType<typeof getMovieBySlug>>>, isFavorited: boolean): MovieDetail {
  return { ...movie, isFavorited };
}

export async function getMostFavorited(limit = 5) {
  return db
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
    .limit(limit);
}
