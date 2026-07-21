"use client";

import { ErrorPage } from "@/components/error-page";

export default function HomeErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="Unable to load home page." reset={reset} />;
}
