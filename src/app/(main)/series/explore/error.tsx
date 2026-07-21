"use client";

import { ErrorPage } from "@/components/error-page";

export default function SeriesExploreErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load series explore." reset={reset} />;
}
