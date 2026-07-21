"use client";

import { ErrorPage } from "@/components/error-page";

export default function LoginErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="Unable to load login page." reset={reset} />;
}
