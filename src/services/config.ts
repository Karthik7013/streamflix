import { movies, series } from "@/db/schema";
import type { AdminListConfig } from "@/lib/admin-list";

export const moviesListConfig: AdminListConfig = {
  sortableColumns: {
    id: movies.id,
    title: movies.title,
    createdAt: movies.createdAt,
    durationSeconds: movies.durationSeconds,
    releaseDate: movies.releaseDate,
    updatedAt: movies.updatedAt,
    published: movies.published,
  },
  filterableColumns: {
    title: movies.title,
    slug: movies.slug,
    description: movies.description,
  },
  searchColumns: [movies.title],
  defaultSortBy: "createdAt",
};

export const seriesListConfig: AdminListConfig = {
  sortableColumns: {
    id: series.id,
    title: series.title,
    createdAt: series.createdAt,
    releaseDate: series.releaseDate,
    updatedAt: series.updatedAt,
  },
  filterableColumns: {
    title: series.title,
    slug: series.slug,
    description: series.description,
  },
  searchColumns: [series.title],
  defaultSortBy: "createdAt",
};
