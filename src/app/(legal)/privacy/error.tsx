"use client";

import { ErrorPage } from "@/components/error-page";

export default function PrivacyErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorPage message="Unable to load privacy policy." reset={reset} />;
}
