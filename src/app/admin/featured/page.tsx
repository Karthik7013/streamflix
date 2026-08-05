"use client";

import { useAdminFeaturedMovies } from "@/hooks/use-admin-featured";
import { FeaturedPage } from "@/app/admin/featured-page";

export default function FeaturedMoviesPage() {
  const data = useAdminFeaturedMovies();

  return (
    <FeaturedPage
      title="Featured Movies"
      description="Manage which movies appear on the home page."
      errorMessage="Unable to load featured movies."
      searchEndpoint="/api/admin/movies"
      dialogTitle="Add Featured Movie"
      entityIdField="movieId"
      data={data}
    />
  );
}
