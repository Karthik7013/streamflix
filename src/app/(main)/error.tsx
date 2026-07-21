"use client";

import { ErrorPage } from "@/components/error-page";

export default function MainErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage reset={reset} />;
}
