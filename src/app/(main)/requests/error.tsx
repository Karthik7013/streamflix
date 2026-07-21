"use client";

import { ErrorPage } from "@/components/error-page";

export default function RequestsErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load requests page." reset={reset} />;
}
