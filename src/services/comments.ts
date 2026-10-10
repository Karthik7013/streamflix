import { db } from "@/db";
import { movieComments, user } from "@/db/schema";
import { eq, desc, count, and, or, lt } from "drizzle-orm";
import { getMovieIdBySlug } from "@/services/movies";
import { cacheGetOrSet, cacheDelByPrefix, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import { ErrorCode } from "@/lib/error-codes";

export async function getCommentsByMovieSlug(
  slug: string,
  args: { cursor?: string; limit: number }
) {
  const { cursor, limit } = args;
  const cacheKey = cacheKeys.comments(slug, cursor, limit);

  return cacheGetOrSet(cacheKey, CACHE_TTL.FAST, async () => {
    const movieId = await getMovieIdBySlug(slug);
    if (!movieId) return { data: [], total: 0, nextCursor: null, hasMore: false };

    const c = decodeCursor<{ c: string; id: number }>(cursor);
    const cursorDate = c ? new Date(c.c) : undefined;
    const cursorWhere = c && cursorDate && !isNaN(cursorDate.getTime())
      ? or(
        lt(movieComments.createdAt, cursorDate),
        and(eq(movieComments.createdAt, cursorDate), lt(movieComments.id, c.id))
      )
      : undefined;

    const where = cursorWhere
      ? and(eq(movieComments.movieId, movieId), cursorWhere)
      : eq(movieComments.movieId, movieId);

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
        .where(where)
        .orderBy(desc(movieComments.createdAt), desc(movieComments.id))
        .limit(limit + 1),
    ]);

    const total = totalResult[0].total;
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasMore && last
      ? encodeCursor({ c: last.createdAt.toISOString(), id: last.id })
      : null;

    const comments = pageRows.map((r) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      user: { id: r.userId, name: r.userName, image: r.userImage },
    }));

    return { data: comments, total, nextCursor, hasMore };
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
