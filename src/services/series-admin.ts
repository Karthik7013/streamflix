import { db } from "@/db";
import { series, seasons, seriesTags, tags } from "@/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { parseAdminListQuery, type AdminListParams } from "@/lib/admin-list";
import { seriesListConfig } from "@/services/series";

export async function listAdminSeries(args: AdminListParams) {
  const { page, limit } = args;
  const { offset, whereClause, orderBy } = parseAdminListQuery(args, seriesListConfig);

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
      trailerUrl: series.trailerUrl,
      tmdbId: series.tmdbId,
      originalLanguage: series.originalLanguage,
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
    data: seriesWithMeta,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total },
  };
}

export async function getAdminSeriesById(id: number) {
  const [seriesRow] = await db
    .select({
      id: series.id,
      title: series.title,
      slug: series.slug,
      description: series.description,
      thumbnailUrl: series.thumbnailUrl,
      backdropUrl: series.backdropUrl,
      trailerUrl: series.trailerUrl,
      releaseDate: series.releaseDate,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      tmdbId: series.tmdbId,
      originalLanguage: series.originalLanguage,
    })
    .from(series).where(eq(series.id, id)).limit(1);
  if (!seriesRow) return null;
  return seriesRow;
}
