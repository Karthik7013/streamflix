import { db } from "@/db";
import { movieComments, user, movies } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

async function getMovieIdBySlug(slug: string): Promise<number | null> {
  const [movieResult] = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, slug))
    .limit(1);
  return movieResult ? movieResult.id : null;
}

export async function getCommentsByMovieSlug(
  slug: string,
  args: { page: number; limit: number }
) {
  const { page, limit } = args;
  const offset = (page - 1) * limit;

  const movieId = await getMovieIdBySlug(slug);
  if (!movieId) return { data: [], meta: { page, limit, total: 0, totalPages: 0, hasMore: false } };

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

  const totalPages = Math.ceil(total / limit);
  return { data: comments, meta: { page, limit, total, totalPages, hasMore: page * limit < total } };
}

export async function createComment(movieSlug: string, userId: string, content: string) {
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return { error: { message: "Content is required", code: "CONTENT_REQUIRED" } };
  }
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return { error: { message: "User ID is required", code: "USER_ID_REQUIRED" } };
  }

  const movieId = await getMovieIdBySlug(movieSlug);
  if (!movieId) return { error: { message: "Movie Not Found", code: "NOT_FOUND" } };

  const [inserted] = await db
    .insert(movieComments)
    .values({ movieId, userId, content: content.trim() })
    .returning();

  const [userRow] = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return {
    comment: {
      id: inserted.id,
      content: inserted.content,
      createdAt: inserted.createdAt,
      user: userRow || { id: userId, name: "Unknown", image: null },
    },
  };
}
