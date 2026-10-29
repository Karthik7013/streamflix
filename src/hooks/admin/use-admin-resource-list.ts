"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminListBase } from "@/hooks/use-admin-list-base";
import { queryKeys } from "@/lib/query-keys";

interface UseAdminResourceListOptions<T, F = string> {
  baseKey: readonly unknown[];
  fetch: (params: {
    page: number;
    limit: number;
    search: string;
    sortBy?: string;
    sortDir?: string;
    extraParams?: Record<string, string>;
  }) => Promise<{ data: T[]; meta: any }>;
  defaultLimit?: number;
  defaultSorting?: any[];
  defaultStatusFilter?: F;
  invalidateKeys?: readonly unknown[][];
}

export function useAdminResourceList<T extends { id: number }, F extends string = string>({
  baseKey,
  fetch,
  defaultLimit = 50,
  defaultSorting = [],
  defaultStatusFilter = "all" as F,
  invalidateKeys,
}: UseAdminResourceListOptions<T, F>) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilterState] = useState<F>(defaultStatusFilter);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const setStatusFilter = useCallback((value: F) => {
    setStatusFilterState(value);
  }, []);

  const list = useAdminListBase<T>({
    baseKey,
    queryFn: async ({ page, limit, search, sortBy, sortDir, extraParams }) => {
      return fetch({ page, limit, search, sortBy, sortDir, extraParams });
    },
    defaultLimit,
    defaultSorting,
    extraParams: { status: statusFilter === ("all" as F) ? "" : (statusFilter as string) },
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: baseKey });
    if (invalidateKeys) {
      for (const k of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: k });
      }
    }
  }, [queryClient, baseKey, invalidateKeys]);

  const createDeleteMutation = useCallback(
    (deleteFn: (id: number) => Promise<any>) =>
      useMutation({
        mutationFn: (id: number) => deleteFn(id),
        onSettled: () => {
          setDeleteTarget(null);
          invalidateAll();
        },
      }),
    [invalidateAll]
  );

  return {
    ...list,
    items: list.items,
    statusFilter,
    setStatusFilter,
    deleteTarget,
    setDeleteTarget,
    invalidateAll,
    createDeleteMutation,
  };
}
