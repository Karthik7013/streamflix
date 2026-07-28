"use client";

import { ErrorPage } from "@/components/error-page";

export default function TrendingErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load trending page." reset={reset} />;
}
