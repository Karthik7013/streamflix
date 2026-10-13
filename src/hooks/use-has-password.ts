"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { STALE } from "@/lib/stale-times";

const PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  credential: "email",
};

export function derivePasswordState(accounts: { providerId: string }[]): {
  hasPassword: boolean;
  providerNames: string[];
} {
  const hasPassword = accounts.some((a) => a.providerId === "credential");
  const providerNames = accounts
    .filter((a) => a.providerId !== "credential")
    .map((a) => PROVIDER_NAMES[a.providerId] ?? "your sign-in provider");
  return { hasPassword, providerNames };
}

export function formatProviderNames(names: string[]): string {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function resolveSignedInProvider(
  lastMethod: string | null,
  providerNames: string[]
): string | null {
  if (!lastMethod || lastMethod === "email") return null;
  const label = PROVIDER_NAMES[lastMethod];
  if (!label) return null;
  return providerNames.includes(label) ? label : null;
}

function getLastAuthMethod(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lastAuthMethod");
}

export function useHasPassword() {
  const { data, isPending } = useQuery({
    queryKey: ["has-password"],
    queryFn: async () => {
      const { data } = await authClient.listAccounts();
      return data ?? [];
    },
    staleTime: STALE.FAST,
    refetchOnMount: false,
  });

  const lastMethod = useMemo(() => getLastAuthMethod(), []);

  return useMemo((): {
    hasPassword: boolean | null;
    providerNames: string[];
    signedInWith: string | null;
    loading: boolean;
  } => {
    if (!data)
      return { hasPassword: null, providerNames: [], signedInWith: null, loading: isPending };
    const derived = derivePasswordState(data);
    return {
      ...derived,
      signedInWith: resolveSignedInProvider(lastMethod, derived.providerNames),
      loading: isPending,
    };
  }, [data, isPending, lastMethod]);
}
