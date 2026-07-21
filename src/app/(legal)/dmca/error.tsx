"use client";

import { ErrorPage } from "@/components/error-page";

export default function DmcaErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load DMCA page." reset={reset} />;
}
