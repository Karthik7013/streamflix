"use client";

import { useAdminFeaturedSeries } from "@/hooks/use-admin-featured";
import { FeaturedPage } from "@/app/admin/featured-page";

export default function FeaturedSeriesPage() {
  const data = useAdminFeaturedSeries();

  return (
    <FeaturedPage
      title="Featured Series"
      description="Manage which series appear on the series home page."
      errorMessage="Unable to load featured series."
      searchEndpoint="/api/admin/series"
      dialogTitle="Add Featured Series"
      entityIdField="seriesId"
      data={data}
    />
  );
}
