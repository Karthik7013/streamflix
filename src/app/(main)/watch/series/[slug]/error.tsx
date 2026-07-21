"use client";

import { ErrorPage } from "@/components/error-page";

export default function WatchSeriesErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="This series is temporarily unavailable." reset={reset} />;
}
