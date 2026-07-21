"use client";

import { ErrorPage } from "@/components/error-page";

export default function ResetPasswordErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;

  return <ErrorPage message="Unable to load reset password page." reset={reset} />;
}
