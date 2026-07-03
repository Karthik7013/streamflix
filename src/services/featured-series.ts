import { featuredSeries, series, seriesTags } from "@/db/schema";
import { createFeaturedService, type HeroItem } from "./featured-base";

const svc = createFeaturedService({
  featuredTable: featuredSeries,
  entityTable: series,
  fkColumn: featuredSeries.seriesId,
  entityIdColumn: series.id,
  tagJunctionTable: seriesTags,
  tagEntityFkColumn: seriesTags.seriesId,
  cachePrefix: "series-detail",
  entityIdField: "seriesId",
});

export const getFeaturedSeries = svc.getHero;
export const listAdminFeaturedSeries = svc.listAdmin;
export const addFeaturedSeries = svc.add;
export const updateFeaturedSeriesOrder = svc.updateOrder;
export const deleteFeaturedSeries = svc.remove;

export type SeriesHeroItem = HeroItem;
