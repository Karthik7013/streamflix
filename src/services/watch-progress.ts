import { db } from "@/db";
import { watchProgress, movies } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getWatchProgress(userId: string, movieId?: number) {
  const conditions = [eq(watchProgress.userId, userId)];
  if (movieId) conditions.push(eq(watchProgress.movieId, movieId));

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [result] = await db
    .select()
    .from(watchProgress)
    .where(where)
    .orderBy(desc(watchProgress.updatedAt))
    .limit(1);

  return result ?? null;
}

export async function getUserWatchProgressList(userId: string, limit = 20) {
  const items = await db
    .select({
      id: watchProgress.id,
      userId: watchProgress.userId,
      movieId: watchProgress.movieId,
      progressSeconds: watchProgress.progressSeconds,
      durationSeconds: watchProgress.durationSeconds,
      completed: watchProgress.completed,
      updatedAt: watchProgress.updatedAt,
      movieTitle: movies.title,
      movieThumbnailUrl: movies.thumbnailUrl,
      movieSlug: movies.slug,
    })
    .from(watchProgress)
    .leftJoin(movies, eq(watchProgress.movieId, movies.id))
    .where(eq(watchProgress.userId, userId))
    .orderBy(desc(watchProgress.updatedAt))
    .limit(limit);

  return items.map((item) => ({
    id: item.id,
    userId: item.userId,
    movieId: item.movieId,
    progressSeconds: item.progressSeconds,
    durationSeconds: item.durationSeconds,
    completed: item.completed,
    updatedAt: item.updatedAt,
    title: item.movieTitle ?? "Untitled",
    thumbnailUrl: item.movieThumbnailUrl ?? null,
    href: `/watch/${item.movieSlug}`,
  }));
}

export async function saveWatchProgress(data: {
  userId: string;
  movieId: number;
  progressSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}) {
  const completed = data.completed ?? (data.progressSeconds / data.durationSeconds >= 0.9);

  const [result] = await db
    .insert(watchProgress)
    .values({
      userId: data.userId,
      movieId: data.movieId,
      progressSeconds: data.progressSeconds,
      durationSeconds: data.durationSeconds,
      completed,
    })
    .onConflictDoUpdate({
      target: [watchProgress.userId, watchProgress.movieId],
      set: {
        progressSeconds: data.progressSeconds,
        durationSeconds: data.durationSeconds,
        completed,
        updatedAt: new Date(),
      },
    })
    .returning();

  return { progress: result };
}

export async function deleteWatchProgress(userId: string, movieId: number) {
  await db
    .delete(watchProgress)
    .where(and(eq(watchProgress.userId, userId), eq(watchProgress.movieId, movieId)));

  return { success: true };
}
