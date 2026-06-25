import { db } from "@/db";
import { movies, watchHistory } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

export async function getContinueWatching(userId: string) {
  return db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      progressSeconds: watchHistory.progressSeconds,
      durationSeconds: movies.durationSeconds,
    })
    .from(watchHistory)
    .innerJoin(movies, eq(watchHistory.movieId, movies.id))
    .where(and(eq(watchHistory.userId, userId), eq(watchHistory.isCompleted, false)))
    .orderBy(desc(watchHistory.watchedAt))
    .limit(10);
}

export async function updateProgress(data: {
  userId: string;
  movieId: number;
  progressSeconds: number;
  isCompleted: boolean;
}) {
  const { userId, movieId, progressSeconds, isCompleted } = data;

  if (typeof progressSeconds !== "number" || progressSeconds < 0) {
    return { error: "Invalid progress" };
  }

  await db
    .insert(watchHistory)
    .values({
      userId,
      movieId,
      progressSeconds,
      isCompleted: isCompleted ?? false,
      watchedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [watchHistory.userId, watchHistory.movieId],
      set: {
        progressSeconds: sql`EXCLUDED.progress_seconds`,
        isCompleted: sql`EXCLUDED.is_completed`,
        watchedAt: sql`EXCLUDED.watched_at`,
      },
    });

  invalidateCache("history");
  return { success: true };
}

export async function getWatchHistory(args: { userId: string; limit: number; offset: number }) {
  const { userId, limit, offset } = args;

  const items = await db
    .select({
      id: watchHistory.id,
      movieId: watchHistory.movieId,
      progressSeconds: watchHistory.progressSeconds,
      isCompleted: watchHistory.isCompleted,
      watchedAt: watchHistory.watchedAt,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      durationSeconds: movies.durationSeconds,
    })
    .from(watchHistory)
    .innerJoin(movies, eq(watchHistory.movieId, movies.id))
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.watchedAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: db.$count(watchHistory, eq(watchHistory.userId, userId)) })
    .from(watchHistory)
    .where(eq(watchHistory.userId, userId));

  return { items, total: count };
}

export async function clearWatchHistory(userId: string) {
  await db.delete(watchHistory).where(eq(watchHistory.userId, userId));
  invalidateCache("history");
  return true;
}
