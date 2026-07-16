import { db } from "@/db";
import { movies, movieTags, tags } from "@/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams, type AdminListConfig } from "@/lib/admin-list";
import { groupBy } from "@/lib/db-utils";

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

export async function listAdminMovies(args: AdminListParams) {
  const { page, limit } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, movieListConfig);

  const [totalResult] = await db.select({ total: count() }).from(movies).where(whereClause);
  const total = totalResult.total;

  const moviesList = await db
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
