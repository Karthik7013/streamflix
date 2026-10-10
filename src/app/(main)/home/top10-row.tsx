"use client";

import { useCallback } from "react";
import { MovieCard } from "@/components/movie-card";
import { Top10Row as SharedTop10Row } from "@/components/top10-row";
import type { MovieCardData } from "@/types";

export function Top10Row({
  data,
}: {
  data: MovieCardData[];
}) {
  const renderCard = useCallback(
    (item: MovieCardData, index: number) => (
      <MovieCard
        title={item.title}
        slug={item.slug}
        thumbnailUrl={item.thumbnailUrl}
        priority={index === 0}
      />
    ),
    [],
  );

  return (
    <SharedTop10Row
      data={data}
      heading="Trending Now · Top 10"
      emptyMessage="No recent additions."
      errorMessage="Unable to load recent titles."
      seeAllHref="/explore"
      renderCard={renderCard}
    />
  );
}
