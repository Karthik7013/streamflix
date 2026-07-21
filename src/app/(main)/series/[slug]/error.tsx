"use client";

import { ErrorPage } from "@/components/error-page";

export default function SeriesDetailErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="This series is temporarily unavailable." reset={reset} />;
}
