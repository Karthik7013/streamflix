"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useUrlParams<T extends Record<string, string | undefined>>() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getParams = useCallback((): T => {
    return Object.fromEntries(searchParams.entries()) as T;
  }, [searchParams]);

  const setParams = useCallback(
    (params: Partial<T>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      if (qs === searchParams.toString()) return;
      router.replace(`${pathname}?${qs}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { getParams, setParams };
}
