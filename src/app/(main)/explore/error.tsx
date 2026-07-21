"use client";

import { ErrorPage } from "@/components/error-page";

export default function ExploreErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="Unable to load explore page." reset={reset} />;
}
