"use client";

import { useCallback } from "react";
import { Top10Row as SharedTop10Row } from "@/components/top10-row";
import { SeriesCard } from "@/components/series-card";
import type { Top10RowItem } from "@/types";

export function Top10Row({
  data,
  loading,
  isError,
  retry,
}: {
  data: Top10RowItem[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  const renderCard = useCallback(
    (item: Top10RowItem) => (
      <SeriesCard
        title={item.title}
        slug={item.slug}
        thumbnailUrl={item.thumbnailUrl as string}
      />
    ),
    [],
  );

  return (
    <SharedTop10Row
      data={data}
      loading={loading}
      isError={isError}
      retry={retry}
      heading="Trending Now · Top 10"
      emptyMessage="No featured series yet."
      errorMessage="Unable to load top 10 series."
      renderCard={renderCard}
    />
  );
}
