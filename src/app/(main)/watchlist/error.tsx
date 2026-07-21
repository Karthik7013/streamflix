"use client";

import { ErrorPage } from "@/components/error-page";

export default function WatchlistErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="Unable to load watchlist." reset={reset} />;
}
