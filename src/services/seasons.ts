import { db } from "@/db";
import { seasons, episodes } from "@/db/schema";
import { eq, asc, sql, count } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { pickDefined } from "@/lib/db-utils";

export interface SeasonRow {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  episodeCount?: number;
}

export async function getSeasonsBySeriesId(seriesId: number) {
  const seasonRows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.seriesId, seriesId))
    .orderBy(asc(seasons.seasonNumber));

  const episodeCounts = await db
    .select({ seasonId: seasons.id, value: count() })
    .from(seasons)
    .leftJoin(episodes, eq(episodes.seasonId, seasons.id))
    .where(eq(seasons.seriesId, seriesId))
    .groupBy(seasons.id);

  const countMap: Record<number, number> = {};
  for (const row of episodeCounts) countMap[row.seasonId] = Number(row.value);

  return seasonRows.map((s) => ({
    ...s,
    episodeCount: countMap[s.id] || 0,
  }));
}

export async function createSeason(seriesId: number, data: {
  seasonNumber?: number;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  releaseDate?: string | null;
}) {
  let seasonNumber = data.seasonNumber;
  if (!seasonNumber) {
    const [maxResult] = await db
      .select({ value: sql<number>`coalesce(max(${seasons.seasonNumber}), 0) + 1` })
      .from(seasons)
      .where(eq(seasons.seriesId, seriesId));
    seasonNumber = Number(maxResult.value);
  }

  const [createdSeason] = await db
    .insert(seasons)
    .values({
      seriesId,
      seasonNumber,
      title: data.title ?? null,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? null,
      releaseDate: data.releaseDate ?? null,
    })
    .returning();

  invalidateCache("series-detail");
  return createdSeason;
}

export async function updateSeason(seasonId: number, data: {
  seasonNumber?: number;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  releaseDate?: string | null;
}) {
  const updateData = pickDefined(data) as Record<string, unknown>;
  if (Object.keys(updateData).length === 0) return null;

  updateData.updatedAt = new Date();
  const [updated] = await db.update(seasons).set(updateData).where(eq(seasons.id, seasonId)).returning();
  if (!updated) return null;

  invalidateCache("series-detail");
  return updated;
}

export async function deleteSeason(seasonId: number) {
  const [deleted] = await db.delete(seasons).where(eq(seasons.id, seasonId)).returning();
  if (!deleted) return false;
  invalidateCache("series-detail");
  return true;
}
