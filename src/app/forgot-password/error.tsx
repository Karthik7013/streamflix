"use client";

import { ErrorPage } from "@/components/error-page";

export default function ForgotPasswordErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load forgot password page." reset={reset} />;
}
