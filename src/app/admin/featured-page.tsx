"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/error-state";
import { FeaturedList } from "@/app/admin/featured-list";
import { AddFeaturedDialog } from "@/app/admin/add-featured-dialog";
import type { FeaturedItem, UseAdminFeaturedReturn } from "@/hooks/use-admin-featured";

interface FeaturedPageProps {
  title: string;
  description: string;
  errorMessage: string;
  searchEndpoint: string;
  dialogTitle: string;
  entityIdField: "movieId" | "seriesId";
  data: UseAdminFeaturedReturn<FeaturedItem>;
}

export function FeaturedPage({
  title,
  description,
  errorMessage,
  searchEndpoint,
  dialogTitle,
  entityIdField,
  data,
}: FeaturedPageProps) {
  const {
    featured, loading, isError, retry,
    addOpen, setAddOpen,
    deletingId,
    handleRemove, handleSwap,
    alreadyFeaturedIds, invalidate,
    isSwapping,
  } = data;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <AddFeaturedDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          searchEndpoint={searchEndpoint}
          entityIdField={entityIdField}
          dialogTitle={dialogTitle}
          alreadyFeaturedIds={alreadyFeaturedIds}
          onSuccess={invalidate}
        />
      </div>

      <Card className="overflow-hidden p-0 flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {isError ? (
            <ErrorState message={errorMessage} onRetry={retry} className="py-8" />
          ) : (
            <FeaturedList featured={featured} isLoading={loading} onSwap={handleSwap} onRemove={handleRemove} deletingId={deletingId} swapping={isSwapping} entityIdField={entityIdField} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
