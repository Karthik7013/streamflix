"use client";

import { ErrorPage } from "@/components/error-page";

export default function MovieDetailErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="This title is temporarily unavailable." reset={reset} />;
}
