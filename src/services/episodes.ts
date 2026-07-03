import { db } from "@/db";
import { episodes } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";

export interface EpisodeRow {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
}

export async function getEpisodesBySeasonId(seasonId: number) {
  return db
    .select()
    .from(episodes)
    .where(eq(episodes.seasonId, seasonId))
    .orderBy(asc(episodes.episodeNumber));
}

export async function createEpisode(seasonId: number, data: {
  episodeNumber?: number;
  title: string;
  slug: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  backdropUrl?: string | null;
  durationSeconds?: number | null;
  releaseDate?: string | null;
}) {
  let episodeNumber = data.episodeNumber;
  if (!episodeNumber) {
    const [maxResult] = await db
      .select({ value: sql<number>`coalesce(max(${episodes.episodeNumber}), 0) + 1` })
      .from(episodes)
      .where(eq(episodes.seasonId, seasonId));
    episodeNumber = Number(maxResult.value);
  }

  const [createdEpisode] = await db
    .insert(episodes)
    .values({
      seasonId,
      episodeNumber,
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      videoUrl: data.videoUrl ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      backdropUrl: data.backdropUrl ?? null,
      durationSeconds: data.durationSeconds ?? null,
      releaseDate: data.releaseDate ?? null,
    })
    .returning();

  invalidateCache("series-detail");
  return createdEpisode;
}

export async function updateEpisode(episodeId: number, data: {
  episodeNumber?: number;
  title?: string;
  slug?: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  backdropUrl?: string | null;
  durationSeconds?: number | null;
  releaseDate?: string | null;
}) {
  const updateData: Record<string, unknown> = {};
  if (data.episodeNumber !== undefined) updateData.episodeNumber = data.episodeNumber;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.backdropUrl !== undefined) updateData.backdropUrl = data.backdropUrl;
  if (data.durationSeconds !== undefined) updateData.durationSeconds = data.durationSeconds;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate;

  if (Object.keys(updateData).length === 0) return null;

  updateData.updatedAt = new Date();
  const [updated] = await db.update(episodes).set(updateData).where(eq(episodes.id, episodeId)).returning();
  if (!updated) return null;

  invalidateCache("series-detail");
  return updated;
}

export async function deleteEpisode(episodeId: number) {
  const [deleted] = await db.delete(episodes).where(eq(episodes.id, episodeId)).returning();
  if (!deleted) return false;
  invalidateCache("series-detail");
  return true;
}
