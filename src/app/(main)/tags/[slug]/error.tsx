"use client";

import { ErrorPage } from "@/components/feedback/error-page";

export default function TagErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load tag." reset={reset} />;
}