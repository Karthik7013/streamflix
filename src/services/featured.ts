import { featuredMovies, movies, movieTags } from "@/db/schema";
import { createFeaturedService } from "@/services/featured-base";
import { invalidateCache } from "@/lib/cache";

const svc = createFeaturedService({
  cacheKey: "movies",
  featuredTable: featuredMovies,
  entityTable: movies,
  fkColumn: featuredMovies.movieId,
  entityIdColumn: movies.id,
  tagJunctionTable: movieTags,
  tagEntityFkColumn: movieTags.movieId,
  entityIdField: "movieId",
  extraHeroColumns: {
    releaseDate: movies.releaseDate,
    durationSeconds: movies.durationSeconds,
  },
});

export const getFeatured = svc.getHero;
export const listAdminFeatured = svc.listAdmin;

export const addFeatured = async (movieId: number) => {
  const created = await svc.add(movieId);
  await invalidateCache("home");
  return created;
};

export const updateFeatured = async (id: number, displayOrder: number) => {
  const updated = await svc.updateOrder(id, displayOrder);
  await invalidateCache("home");
  return updated;
};

export const deleteFeatured = async (id: number) => {
  const deleted = await svc.remove(id);
  await invalidateCache("home");
  return deleted;
};
