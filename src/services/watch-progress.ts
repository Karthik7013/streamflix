import { db } from "@/db";
import { watchProgress, movies, episodes, seasons, series } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getWatchProgress(userId: string, movieId?: number, episodeId?: number) {
  const conditions = [eq(watchProgress.userId, userId)];
  if (movieId) conditions.push(eq(watchProgress.movieId, movieId));
  if (episodeId) conditions.push(eq(watchProgress.episodeId, episodeId));

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
      episodeId: watchProgress.episodeId,
      progressSeconds: watchProgress.progressSeconds,
      durationSeconds: watchProgress.durationSeconds,
      completed: watchProgress.completed,
      updatedAt: watchProgress.updatedAt,
      movieTitle: movies.title,
      movieThumbnailUrl: movies.thumbnailUrl,
      movieSlug: movies.slug,
      episodeTitle: episodes.title,
      episodeThumbnailUrl: episodes.thumbnailUrl,
      seriesSlug: series.slug,
      seasonNumber: seasons.seasonNumber,
      episodeNumber: episodes.episodeNumber,
    })
    .from(watchProgress)
    .leftJoin(movies, eq(watchProgress.movieId, movies.id))
    .leftJoin(episodes, eq(watchProgress.episodeId, episodes.id))
    .leftJoin(seasons, eq(episodes.seasonId, seasons.id))
    .leftJoin(series, eq(seasons.seriesId, series.id))
    .where(eq(watchProgress.userId, userId))
    .orderBy(desc(watchProgress.updatedAt))
    .limit(limit);

  return items.map((item) => ({
    id: item.id,
    userId: item.userId,
    movieId: item.movieId,
    episodeId: item.episodeId,
    progressSeconds: item.progressSeconds,
    durationSeconds: item.durationSeconds,
    completed: item.completed,
    updatedAt: item.updatedAt,
    title: item.movieTitle ?? item.episodeTitle ?? "Untitled",
    thumbnailUrl: item.movieThumbnailUrl ?? item.episodeThumbnailUrl ?? null,
    href: item.movieId
      ? `/movies/${item.movieSlug}`
      : item.episodeId && item.seriesSlug && item.seasonNumber && item.episodeNumber
        ? `/watch/series/${item.seriesSlug}?season=${item.seasonNumber}&episode=${item.episodeNumber}`
        : "/",
  }));
}

export async function saveWatchProgress(data: {
  userId: string;
  movieId?: number;
  episodeId?: number;
  progressSeconds: number;
  durationSeconds: number;
  completed?: boolean;
}) {
  if (!data.movieId && !data.episodeId) {
    return { error: { message: "Either movieId or episodeId is required", code: "VALIDATION_ERROR" } };
  }

  const completed = data.completed ?? (data.progressSeconds / data.durationSeconds >= 0.9);

  const [result] = await db
    .insert(watchProgress)
    .values({
      userId: data.userId,
      movieId: data.movieId ?? null,
      episodeId: data.episodeId ?? null,
      progressSeconds: data.progressSeconds,
      durationSeconds: data.durationSeconds,
      completed,
    })
    .onConflictDoUpdate({
      target: [watchProgress.userId, watchProgress.movieId, watchProgress.episodeId],
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

export async function deleteWatchProgress(userId: string, movieId?: number, episodeId?: number) {
  if (!movieId && !episodeId) {
    return { error: { message: "Either movieId or episodeId is required", code: "VALIDATION_ERROR" } };
  }

  const conditions = [eq(watchProgress.userId, userId)];
  if (movieId) conditions.push(eq(watchProgress.movieId, movieId));
  if (episodeId) conditions.push(eq(watchProgress.episodeId, episodeId));

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  await db.delete(watchProgress).where(where);

  return { success: true };
}
