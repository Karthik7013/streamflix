import { db } from "@/db";
import { episodes, seasons, series } from "@/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { pickDefined } from "@/lib/db-utils";
import { buildIAUrl } from "@/lib/upload-utils";

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

  let computedVideoUrl = data.videoUrl ?? null;
  if (!computedVideoUrl) {
    const [seasonRow] = await db
      .select({ seriesSlug: series.slug, seasonNumber: seasons.seasonNumber })
      .from(seasons)
      .innerJoin(series, eq(seasons.seriesId, series.id))
      .where(eq(seasons.id, seasonId))
      .limit(1);
    if (seasonRow) {
      computedVideoUrl = buildIAUrl(`series/${seasonRow.seriesSlug}/season-${seasonRow.seasonNumber}/episode-${episodeNumber}/videos/video.mp4`);
    }
  }

  const [createdEpisode] = await db
    .insert(episodes)
    .values({
      seasonId,
      episodeNumber,
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      videoUrl: computedVideoUrl,
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
  const updateData = pickDefined(data) as Record<string, unknown>;
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
