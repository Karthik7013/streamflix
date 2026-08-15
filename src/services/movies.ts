import { db } from "@/db";
import { movies, movieTags, tags, watchlist } from "@/db/schema";
import { eq, and, ne, inArray, desc, count } from "drizzle-orm";
import { groupBy } from "@/lib/db-utils";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { type AdminListConfig } from "@/lib/admin-list";
import { paginatedList } from "@/services/paginated-list";

export const RELATED_MOVIES_LIMIT = 6;
export const TOP_FAVORITES_LIMIT = 5;

interface MovieRow {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
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

  const related = await getRelatedMovies(slug);

  return { ...movieResult[0], tags: tagRows, related };
  });
}

export async function getRelatedMovies(slug: string) {
  return cacheGetOrSet(`related:${slug}`, CACHE_TTL.SLOW, async () => {
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

    if (movieResult.length === 0 || tagRows.length === 0) return [];

    const movie = movieResult[0];
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
  });
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
  const result = await paginatedList<MovieRow>({
    config: movieListConfig,
    select: {
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
    },
    table: movies,
    junction: movieTags,
    junctionFk: movieTags.movieId,
    junctionTagId: movieTags.tagId,
    bodyId: movies.id,
    searchColumn: movies.title,
    conditions: [eq(movies.published, true)],
    q: args.q,
    tagsParam: args.tagsParam,
    page: args.page,
    limit: args.limit,
    sortBy: args.sortBy,
    sortDir: args.sortDir,
    errorContext: "searchMovies",
  });
  const data = await attachTags(result.data);
  return { data, meta: result.meta };
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