import { db } from "@/db";
import { series, seasons, episodes, seriesTags, tags } from "@/db/schema";
import { eq, and, inArray, asc, desc, ilike, sql, count } from "drizzle-orm";
import { invalidateCache } from "@/lib/cache";
import { validateSlug } from "@/lib/validation";

export interface SeriesRow {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  releaseDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeasonRow {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  episodeCount?: number;
}

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

interface SeriesDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string;
  backdropUrl: string | null;
  releaseDate: string | null;
  tags: { id: number; name: string }[];
  seasons: {
    id: number;
    seasonNumber: number;
    title: string | null;
    episodes: {
      id: number;
      episodeNumber: number;
      title: string;
      slug: string;
      description: string | null;
      videoUrl: string | null;
      thumbnailUrl: string | null;
      backdropUrl: string | null;
      durationSeconds: number | null;
    }[];
  }[];
}

const seriesSortableColumns: Record<string, any> = {
  id: series.id,
  title: series.title,
  createdAt: series.createdAt,
  releaseDate: series.releaseDate,
  updatedAt: series.updatedAt,
};

const seriesFilterableColumns: Record<string, any> = {
  title: series.title,
  slug: series.slug,
  description: series.description,
};

export async function createSeries(data: {
  title: string;
  slug: string;
  description?: string | null;
  thumbnailUrl?: string;
  backdropUrl?: string | null;
  releaseDate?: string | null;
  tagIds?: number[];
}) {
  const [createdSeries] = await db
    .insert(series)
    .values({
      title: data.title,
      slug: data.slug,
      description: data.description ?? null,
      thumbnailUrl: data.thumbnailUrl ?? "",
      backdropUrl: data.backdropUrl ?? null,
      releaseDate: data.releaseDate ?? null,
    })
    .returning();

  if (data.tagIds && data.tagIds.length > 0) {
    await db.insert(seriesTags).values(
      data.tagIds.map((tagId) => ({ seriesId: createdSeries.id, tagId }))
    );
  }

  invalidateCache("series-list");
  return createdSeries;
}

export async function updateSeries(
  id: number,
  data: {
    title?: string;
    slug?: string;
    description?: string | null;
    thumbnailUrl?: string;
    backdropUrl?: string | null;
    releaseDate?: string | null;
    tagIds?: number[];
  }
) {
  const [existingSeries] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!existingSeries) return null;

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.backdropUrl !== undefined) updateData.backdropUrl = data.backdropUrl;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate;

  if (Object.keys(updateData).length > 0) {
    updateData.updatedAt = new Date();
    await db.update(series).set(updateData).where(eq(series.id, id));
  }

  if (data.tagIds && Array.isArray(data.tagIds)) {
    await db.delete(seriesTags).where(eq(seriesTags.seriesId, id));
    if (data.tagIds.length > 0) {
      await db.insert(seriesTags).values(
        data.tagIds.map((tagId) => ({ seriesId: id, tagId }))
      );
    }
  }

  const [updatedSeries] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  invalidateCache("series-list");
  return updatedSeries;
}

export async function deleteSeries(id: number) {
  const [existing] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!existing) return false;

  await db.delete(seriesTags).where(eq(seriesTags.seriesId, id));
  await db.delete(series).where(eq(series.id, id));

  invalidateCache("series-list");
  return true;
}

export async function listAdminSeries(args: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  columnFilters?: Record<string, string>;
}) {
  const { page, limit, search, sortBy, sortDir, columnFilters = {} } = args;
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (search) conditions.push(ilike(series.title, `%${search}%`));

  for (const [col, val] of Object.entries(columnFilters)) {
    const columnRef = seriesFilterableColumns[col];
    if (columnRef && val) {
      conditions.push(ilike(columnRef, `%${val}%`));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const sortColumn = seriesSortableColumns[sortBy || ""] || series.createdAt;
  const orderBy = sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [totalResult] = await db
    .select({ total: count() })
    .from(series)
    .where(whereClause);
  const total = totalResult.total;

  const seriesList = await db
    .select({
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
      backdropUrl: series.backdropUrl,
      releaseDate: series.releaseDate,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
    })
    .from(series)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const seriesIds = seriesList.map((s) => s.id);

  const [tagRows, seasonCounts] = await Promise.all([
    seriesIds.length > 0
      ? db
          .select({ seriesId: seriesTags.seriesId, id: tags.id, name: tags.name, createdAt: tags.createdAt })
          .from(seriesTags)
          .innerJoin(tags, eq(seriesTags.tagId, tags.id))
          .where(inArray(seriesTags.seriesId, seriesIds))
      : Promise.resolve([]),
    seriesIds.length > 0
      ? db
          .select({ seriesId: seasons.seriesId, value: count() })
          .from(seasons)
          .where(inArray(seasons.seriesId, seriesIds))
          .groupBy(seasons.seriesId)
      : Promise.resolve([]),
  ]);

  const tagsBySeriesId: Record<number, { id: number; name: string }[]> = {};
  for (const row of tagRows) {
    if (!tagsBySeriesId[row.seriesId]) tagsBySeriesId[row.seriesId] = [];
    tagsBySeriesId[row.seriesId].push({ id: row.id, name: row.name });
  }

  const seasonCountMap: Record<number, number> = {};
  for (const row of seasonCounts) {
    seasonCountMap[row.seriesId] = Number(row.value);
  }

  const seriesWithMeta = seriesList.map((s) => ({
    ...s,
    tags: tagsBySeriesId[s.id] || [],
    seasonCount: seasonCountMap[s.id] || 0,
  }));

  return {
    series: seriesWithMeta,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function listSeries(args: {
  q?: string;
  tagsParam?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}) {
  const { q, tagsParam, page = 1, limit = 12, sortBy = "createdAt", sortDir = "desc" } = args;
  const offset = (page - 1) * limit;

  const sortCol = seriesSortableColumns[sortBy] || series.createdAt;
  const orderDir = sortDir === "asc" ? asc(sortCol) : desc(sortCol);

  const conditions: any[] = [];
  if (q) conditions.push(ilike(series.title, `%${q}%`));

  if (tagsParam) {
    const tagIds = tagsParam.split(",").map(Number);
    const settled = await Promise.allSettled([
      db
        .select({
          id: series.id,
          title: series.title,
          slug: series.slug,
          thumbnailUrl: series.thumbnailUrl,
        })
        .from(series)
        .innerJoin(seriesTags, eq(series.id, seriesTags.seriesId))
        .where(
          conditions.length > 0
            ? and(...conditions, inArray(seriesTags.tagId, tagIds))
            : inArray(seriesTags.tagId, tagIds)
        )
        .groupBy(series.id)
        .having(sql`count(distinct ${seriesTags.tagId}) = ${tagIds.length}`)
        .orderBy(orderDir)
        .limit(limit)
        .offset(offset),
      db
        .select({ value: count() })
        .from(
          db
            .select({ id: series.id })
            .from(series)
            .innerJoin(seriesTags, eq(series.id, seriesTags.seriesId))
            .where(
              conditions.length > 0
                ? and(...conditions, inArray(seriesTags.tagId, tagIds))
                : inArray(seriesTags.tagId, tagIds)
            )
            .groupBy(series.id)
            .having(sql`count(distinct ${seriesTags.tagId}) = ${tagIds.length}`)
            .as("filtered")
        ),
    ]);

    if (settled.some((r) => r.status === "rejected")) return { series: [], total: 0 };
    const r0 = settled[0] as PromiseFulfilledResult<any[]>;
    const r1 = settled[1] as PromiseFulfilledResult<{ value: number }[]>;
    return { series: r0.value, total: r1.value[0].value };
  }

  const settled = await Promise.allSettled([
    db
      .select({
        id: series.id,
        title: series.title,
        slug: series.slug,
        thumbnailUrl: series.thumbnailUrl,
      })
      .from(series)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(series)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ]);

  if (settled.some((r) => r.status === "rejected")) return { series: [], total: 0 };
  const r0 = settled[0] as PromiseFulfilledResult<any[]>;
  const r1 = settled[1] as PromiseFulfilledResult<{ value: number }[]>;
  return { series: r0.value, total: r1.value[0].value };
}

export async function getSeriesBySlug(slug: string) {
  const [seriesResult, tagRows] = await Promise.all([
    db.select().from(series).where(eq(series.slug, slug)).limit(1),
    db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .innerJoin(seriesTags, eq(tags.id, seriesTags.tagId))
      .innerJoin(series, eq(seriesTags.seriesId, series.id))
      .where(eq(series.slug, slug)),
  ]);

  if (seriesResult.length === 0) return null;

  const seasonRows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.seriesId, seriesResult[0].id))
    .orderBy(asc(seasons.seasonNumber));

  const seasonIds = seasonRows.map((s) => s.id);
  const episodeRows =
    seasonIds.length > 0
      ? await db
          .select()
          .from(episodes)
          .where(inArray(episodes.seasonId, seasonIds))
          .orderBy(asc(episodes.episodeNumber))
      : [];

  const episodesBySeason: Record<number, EpisodeRow[]> = {};
  for (const ep of episodeRows) {
    if (!episodesBySeason[ep.seasonId]) episodesBySeason[ep.seasonId] = [];
    episodesBySeason[ep.seasonId].push(ep);
  }

  return {
    ...seriesResult[0],
    tags: tagRows,
    seasons: seasonRows.map((s) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      episodes: episodesBySeason[s.id] || [],
    })),
  };
}

export async function getAdminSeriesById(id: number) {
  const [seriesRow] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!seriesRow) return null;

  const tagRows = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .innerJoin(seriesTags, eq(tags.id, seriesTags.tagId))
    .where(eq(seriesTags.seriesId, id));

  return { ...seriesRow, tags: tagRows };
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

export async function getEpisodesBySeasonId(seasonId: number) {
  return db
    .select()
    .from(episodes)
    .where(eq(episodes.seasonId, seasonId))
    .orderBy(asc(episodes.episodeNumber));
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
  const updateData: Record<string, unknown> = {};
  if (data.seasonNumber !== undefined) updateData.seasonNumber = data.seasonNumber;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate;

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
