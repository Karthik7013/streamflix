"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAdminFeaturedMovies } from "@/hooks/use-admin-featured-movies";
import { FeaturedList } from "@/app/admin/featured-list";
import { AddFeaturedDialog } from "@/app/admin/add-featured-dialog";

export default function FeaturedMoviesPage() {
  const {
    featured, isLoading,
    addOpen, setAddOpen,
    deletingId,
    handleRemove, handleSwap,
    alreadyFeaturedIds, invalidate,
  } = useAdminFeaturedMovies();

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Movies</h1>
          <p className="text-muted-foreground mt-1">Manage which movies appear on the home page.</p>
        </div>
        <AddFeaturedDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          searchEndpoint="/api/admin/movies"
          entityIdField="movieId"
          dialogTitle="Add Featured Movie"
          alreadyFeaturedIds={alreadyFeaturedIds}
          onSuccess={invalidate}
        />
      </div>

      <Card className="overflow-hidden p-0 flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          <FeaturedList featured={featured} isLoading={isLoading} onSwap={handleSwap} onRemove={handleRemove} deletingId={deletingId} entityIdField="movieId" />
        </CardContent>
      </Card>
    </div>
  );
}
