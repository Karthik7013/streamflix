import { featuredMovies, movies, movieTags } from "@/db/schema";
import { createFeaturedService } from "@/services/featured-base";

const svc = createFeaturedService({
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
export const addFeatured = svc.add;
export const updateFeatured = svc.updateOrder;
export const deleteFeatured = svc.remove;
