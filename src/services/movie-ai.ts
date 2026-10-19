import { db } from "@/db";
import { movies } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getCommentsByMovieSlug } from "@/services/comments";
import { getRelatedMovies } from "@/services/movies";

export const MOVIE_REVIEWS_LIMIT = 10;
export const SIMILAR_MOVIE_DESCRIPTION_LIMIT = 300;

export interface MovieChatReview {
  author: string;
  comment: string;
}

export interface MovieChatSimilarMovie {
  title: string;
  slug: string;
  thumbnailUrl: string;
  description: string;
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}…`;
}

export async function getMovieReviewsForChat(
  slug: string,
  limit = MOVIE_REVIEWS_LIMIT
): Promise<MovieChatReview[]> {
  const { data } = await getCommentsByMovieSlug(slug, { limit });
  return data.map((comment) => ({
    author: comment.user.name,
    comment: comment.content,
  }));
}

export async function getSimilarMoviesForChat(
  slug: string
): Promise<MovieChatSimilarMovie[]> {
  const related = await getRelatedMovies(slug);
  if (related.length === 0) return [];

  const rows = await db
    .select({ slug: movies.slug, description: movies.description })
    .from(movies)
    .where(inArray(movies.slug, related.map((r) => r.slug)));

  const descriptions = new Map(rows.map((r) => [r.slug, r.description]));

  return related.map((r) => ({
    title: r.title,
    slug: r.slug,
    thumbnailUrl: r.thumbnailUrl,
    description: truncate(
      descriptions.get(r.slug) ?? "",
      SIMILAR_MOVIE_DESCRIPTION_LIMIT
    ),
  }));
}
