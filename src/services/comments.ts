import { db } from "@/db";
import { movieComments, user, movies } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

export async function getCommentsByMovieSlug(
  slug: string,
  args: { page: number; limit: number }
) {
  const { page, limit } = args;
  const offset = (page - 1) * limit;

  const [movieResult] = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, slug))
    .limit(1);
  if (!movieResult) return { comments: [], total: 0, page, hasMore: false };

  const movieId = movieResult.id;

  const [totalResult, rows] = await Promise.all([
    db.select({ total: count() }).from(movieComments).where(eq(movieComments.movieId, movieId)),
    db
      .select({
        id: movieComments.id,
        content: movieComments.content,
        createdAt: movieComments.createdAt,
        userId: user.id,
        userName: user.name,
        userImage: user.image,
      })
      .from(movieComments)
      .innerJoin(user, eq(movieComments.userId, user.id))
      .where(eq(movieComments.movieId, movieId))
      .orderBy(desc(movieComments.createdAt))
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalResult[0].total;
  const comments = rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    user: { id: r.userId, name: r.userName, image: r.userImage },
  }));

  return { comments, total, page, hasMore: page * limit < total };
}

export async function createComment(movieSlug: string, userId: string, content: string) {
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return { error: "Content is required" };
  }

  const [movieResult] = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, movieSlug))
    .limit(1);
  if (!movieResult) return { error: "Movie Not Found" };

  const [comment] = await db
    .insert(movieComments)
    .values({ movieId: movieResult.id, userId, content: content.trim() })
    .returning();
  invalidateCache("comments");
  return { comment };
}
