"use client";

import { authClient } from "@/lib/auth-client";

export function useSession() {
  const { data, isPending, error, refetch } = authClient.useSession();
  return {
    data: data ?? null,
    loading: isPending,
    isError: !!error,
    retry: refetch,
  };
}
