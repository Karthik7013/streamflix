import { db } from "@/db";
import { movies, movieTags, tags, watchlist } from "@/db/schema";
import { eq, and, ne, inArray, asc, desc, ilike, sql, count, type SQL } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { groupBy } from "@/lib/db-utils";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { type AdminListConfig } from "@/lib/admin-list";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export const RELATED_MOVIES_LIMIT = 6;
export const TOP_FAVORITES_LIMIT = 5;

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
  originalLanguage: string | null;
  tags: { id: number; name: string }[];
  isInWatchlist?: boolean;
  related: { id: number; title: string; slug: string; thumbnailUrl: string }[];
}

export async function getMovieBySlug(slug: string) {
  return cacheGetOrSet(`movie:${slug}`, CACHE_TTL.SLOW, async () => {
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
        originalLanguage: movies.originalLanguage,
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

  const movie = movieResult[0];
  const tagIds = tagRows.map((t) => t.id);

  let related: { id: number; title: string; slug: string; thumbnailUrl: string }[] = [];
  if (tagIds.length > 0) {
    related = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies)
      .innerJoin(movieTags, eq(movieTags.movieId, movies.id))
      .where(and(inArray(movieTags.tagId, tagIds), ne(movies.id, movie.id), eq(movies.published, true)))
      .groupBy(movies.id)
      .orderBy(desc(movies.createdAt))
      .limit(RELATED_MOVIES_LIMIT);
  }

  return { ...movie, tags: tagRows, related };
  });
}

export async function checkIsInWatchlist(movieId: number, userId: string) {
  const [result] = await db
    .select({ isInWatchlist: sql<boolean>`true` })
    .from(watchlist)
    .where(
      and(eq(watchlist.userId, userId), eq(watchlist.movieId, movieId))
    )
    .limit(1);
  return !!result;
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
    .innerJoin(movieTags, eq(movieTags.movieId, movies.id))
    .where(and(inArray(movieTags.tagId, tagIds), ne(movies.id, movie.id), eq(movies.published, true)))
    .groupBy(movies.id)
    .orderBy(desc(movies.createdAt))
    .limit(RELATED_MOVIES_LIMIT);
}

export async function attachTags(rows: MovieRow[]) {
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const tagRows = await db
    .select({ movieId: movieTags.movieId, tagId: tags.id, tagName: tags.name })
    .from(movieTags)
    .innerJoin(tags, eq(movieTags.tagId, tags.id))
    .where(inArray(movieTags.movieId, ids));
  const tagsByMovieId = groupBy(tagRows, (t) => t.movieId);
  return rows.map((r) => ({
    ...r,
    tags: (tagsByMovieId.get(r.id) ?? []).map((t) => ({ id: t.tagId, name: t.tagName })),
  }));
}

const movieListConfig: AdminListConfig = {
  sortableColumns: {
    id: movies.id,
    title: movies.title,
    createdAt: movies.createdAt,
    durationSeconds: movies.durationSeconds,
    releaseDate: movies.releaseDate,
    updatedAt: movies.updatedAt,
  },
  filterableColumns: {
    title: movies.title,
    slug: movies.slug,
    description: movies.description,
  },
  searchColumns: [movies.title],
  defaultSortBy: "createdAt",
};

export async function searchMovies(args: {
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  const { q, tagsParam, page = 1, limit = DEFAULT_PAGE_SIZE, sortBy = "createdAt", sortDir = "desc" } = args;
  const offset = (page - 1) * limit;

  const sortCol = movieListConfig.sortableColumns[sortBy] || movies.createdAt;
  const orderDir = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const conditions: SQL[] = [];
  if (q) conditions.push(ilike(movies.title, `%${q}%`));
  conditions.push(eq(movies.published, true));

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
      const data = await attachTags(movieRows);
      const total = totalRows[0].value;
      return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
    } catch (err) {
      logger.error("searchMovies", err);
      return { data: [], meta: { page, limit, total: 0, totalPages: 0, hasMore: false } };
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
    const data = await attachTags(movieRows);
    const total = totalRows[0].value;
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
  } catch (err) {
    logger.error("searchMovies", err);
    return { data: [], meta: { page, limit, total: 0, totalPages: 0, hasMore: false } };
  }
}

export function movieDetailToResponse(movie: NonNullable<Awaited<ReturnType<typeof getMovieBySlug>>>, isInWatchlist_: boolean): MovieDetail {
  return { ...movie, isInWatchlist: isInWatchlist_ };
}

export async function getMostFavorited(limit = TOP_FAVORITES_LIMIT) {
  return db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      favCount: count(watchlist.movieId),
    })
    .from(movies)
    .innerJoin(watchlist, eq(movies.id, watchlist.movieId))
    .where(eq(movies.published, true))
    .groupBy(movies.id)
    .orderBy(desc(count(watchlist.movieId)))
    .limit(limit);
}
