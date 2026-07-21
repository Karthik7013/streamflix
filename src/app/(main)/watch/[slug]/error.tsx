"use client";

import { ErrorPage } from "@/components/error-page";

export default function WatchMovieErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="This video is temporarily unavailable." reset={reset} />;
}
