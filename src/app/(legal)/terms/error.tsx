"use client";

import { ErrorPage } from "@/components/error-page";

export default function TermsErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="Unable to load terms of service." reset={reset} />;
}
