"use client";

import { ErrorPage } from "@/components/error-page";

export default function LegalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load this page." reset={reset} />;
}
