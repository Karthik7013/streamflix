import { db } from "@/db";
import { movies, movieTags, tags, favorites } from "@/db/schema";
import { eq, and, count, inArray, type SQL } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";
import { groupBy, pickDefined } from "@/lib/db-utils";
import { invalidateCache } from "@/lib/cache";
import { deleteFromIA, buildIAUrl } from "@/lib/upload-utils";
import { logger } from "@/lib/logger";

const movieListConfig: AdminListConfig = {
  sortableColumns: {
    id: movies.id,
    title: movies.title,
    createdAt: movies.createdAt,
    durationSeconds: movies.durationSeconds,
    releaseDate: movies.releaseDate,
    updatedAt: movies.updatedAt,
    published: movies.published,
  },
  filterableColumns: {
    title: movies.title,
    slug: movies.slug,
    description: movies.description,
  },
  searchColumns: [movies.title],
  defaultSortBy: "createdAt",
};

export async function listAdminMovies(args: AdminListParams) {
  const { page, limit, columnFilters = {} } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, movieListConfig);
  const publishedFilter = columnFilters.published;

  const conditions: SQL[] = [];
  if (whereClause) conditions.push(whereClause);
  if (publishedFilter === "true") conditions.push(eq(movies.published, true));
  else if (publishedFilter === "false") conditions.push(eq(movies.published, false));

  const finalWhere = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult, moviesList] = await Promise.all([
    db.select({ total: count() }).from(movies).where(finalWhere),
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
      originalLanguage: movies.originalLanguage,
      tmdbId: movies.tmdbId,
      createdAt: movies.createdAt,
      updatedAt: movies.updatedAt,
      published: movies.published,
    })
    .from(movies)
    .where(finalWhere)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset),
  ]);
  const total = totalResult[0].total;

  const movieIds = moviesList.map((m) => m.id);
  const tagRows =
    movieIds.length > 0
      ? await db
          .select({ movieId: movieTags.movieId, id: tags.id, name: tags.name, createdAt: tags.createdAt })
          .from(movieTags)
          .innerJoin(tags, eq(movieTags.tagId, tags.id))
          .where(inArray(movieTags.movieId, movieIds))
      : [];

  const tagsByMovieId = groupBy(tagRows, (row) => row.movieId);

  const moviesWithTags = moviesList.map((movie) => ({
    ...movie,
    tags: (tagsByMovieId.get(movie.id) ?? []).map((row) => ({ id: row.id, name: row.name, createdAt: row.createdAt })),
  }));

  return {
    data: moviesWithTags,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  };
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
      published: false,
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
    published?: boolean;
  }
) {
  const { title, slug, description, videoUrl, thumbnailUrl, backdropUrl, trailerUrl, durationSeconds, releaseDate, tagIds, tmdbId, originalLanguage, published } = data;

  const updateData = pickDefined<typeof movies.$inferInsert>({
    title, slug, description, videoUrl, thumbnailUrl, backdropUrl,
    trailerUrl, durationSeconds, releaseDate, tmdbId, originalLanguage, published,
  });

  if (Object.keys(updateData).length > 0) {
    const payload = { ...updateData, updatedAt: new Date() };
    const [updatedMovie] = await db.update(movies).set(payload).where(eq(movies.id, movieId)).returning();

    if (tagIds && Array.isArray(tagIds)) {
      await db.delete(movieTags).where(eq(movieTags.movieId, movieId));
      if (tagIds.length > 0) {
        await db.insert(movieTags).values(tagIds.map((tagId) => ({ movieId, tagId })));
      }
    }

    invalidateCache("movies-list");
    invalidateCache("movie-detail");
    return updatedMovie;
  }

  if (tagIds && Array.isArray(tagIds)) {
    await db.delete(movieTags).where(eq(movieTags.movieId, movieId));
    if (tagIds.length > 0) {
      await db.insert(movieTags).values(tagIds.map((tagId) => ({ movieId, tagId })));
    }
  }

  invalidateCache("movies-list");
  invalidateCache("movie-detail");
  return (await db.select({ id: movies.id, title: movies.title, slug: movies.slug, description: movies.description, videoUrl: movies.videoUrl, thumbnailUrl: movies.thumbnailUrl, backdropUrl: movies.backdropUrl, trailerUrl: movies.trailerUrl, durationSeconds: movies.durationSeconds, releaseDate: movies.releaseDate, originalLanguage: movies.originalLanguage, tmdbId: movies.tmdbId, createdAt: movies.createdAt, updatedAt: movies.updatedAt, published: movies.published }).from(movies).where(eq(movies.id, movieId)).limit(1))[0] ?? null;
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
  invalidateCache("movie-detail");
  return true;
}
