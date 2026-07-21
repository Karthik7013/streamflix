"use client";

import { useCallback } from "react";
import { MovieCard } from "@/components/movie-card";
import { Top10Row as SharedTop10Row } from "@/components/top10-row";
import type { MovieCardData, Top10RowItem } from "@/types";

export function Top10Row({
  data,
  loading,
  isError,
  retry,
}: {
  data: MovieCardData[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
}) {
  const renderCard = useCallback(
    (item: Top10RowItem) => (
      <MovieCard
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
      emptyMessage="No recent additions."
      errorMessage="Unable to load recent titles."
      renderCard={renderCard}
    />
  );
}
