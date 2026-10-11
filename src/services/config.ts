import { movies } from "@/db/schema";
import type { AdminListConfig } from "@/lib/pagination";

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
