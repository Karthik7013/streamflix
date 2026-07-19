"use client";

import { NumberSVG } from "@/components/number-svg";

const SKELETON_ITEMS_5 = Array.from({ length: 5 }, (_, i) => i);
import { SeriesCard } from "@/components/series-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { SeriesCardItem } from "@/services/series-recent";

export function Top10Row({
  data,
  loading,
  isError,
  retry,
}: {
  data: SeriesCardItem[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  if (loading) {
    return (
      <section className="px-4 md:px-8 lg:px-12 pb-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="flex gap-2 overflow-hidden py-4">
          {SKELETON_ITEMS_5.map((i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="size-10 shrink-0 mr-1" />
              <Skeleton className="w-44 aspect-2/3 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="px-4 md:px-8 lg:px-12 pb-8">
        <ErrorState message="Unable to load top 10 series." onRetry={retry} />
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section className="px-4 md:px-8 lg:px-12 pb-8">
        <h2 className="text-xl font-semibold mb-4">Trending Now · Top 10</h2>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground">No featured series yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 lg:px-12 pb-8">
      <h2 className="text-xl font-semibold mb-4">Trending Now · Top 10</h2>
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden py-4 snap-x snap-mandatory scroll-pl-4">
        {data.map((s, index) => (
          <div key={s.id} className="group shrink-0 snap-start">
            <div className="flex items-center">
              <NumberSVG number={index + 1} />
              <div className={`relative z-10 w-44 shrink-0 ${index > 0 ? "-ml-16" : "-ml-4"}`}>
                <SeriesCard title={s.title} slug={s.slug} thumbnailUrl={s.thumbnailUrl} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
