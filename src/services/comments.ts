import { db } from "@/db";
import { movieComments, user } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getMovieIdBySlug } from "@/services/movies";
import { cacheGetOrSet, cacheDelByPrefix, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { ErrorCode } from "@/lib/error-codes";

export async function getCommentsByMovieSlug(
  slug: string,
  args: { page: number; limit: number }
) {
  const { page, limit } = args;
  const cacheKey = cacheKeys.comments(slug, page, limit);

  return cacheGetOrSet(cacheKey, CACHE_TTL.FAST, async () => {
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
  });
}

export async function createComment(
  movieSlug: string,
  userId: string,
  content: string,
  userInfo: { userName?: string | null; userImage?: string | null } = {}
) {
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return { error: { message: "Content is required", code: ErrorCode.ValidationError } };
  }
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return { error: { message: "User ID is required", code: ErrorCode.ValidationError } };
  }

  const movieId = await getMovieIdBySlug(movieSlug);
  if (!movieId) return { error: { message: "Movie Not Found", code: ErrorCode.NotFound } };

  const [inserted] = await db
    .insert(movieComments)
    .values({ movieId, userId, content: content.trim() })
    .returning();

  await cacheDelByPrefix(cacheKeys.commentsPrefix(movieSlug));

  return {
    comment: {
      id: inserted.id,
      content: inserted.content,
      createdAt: inserted.createdAt,
      user: {
        id: userId,
        name: userInfo.userName ?? "Unknown",
        image: userInfo.userImage ?? null,
      },
    },
  };
}
