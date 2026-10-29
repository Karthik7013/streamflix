"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import { ADMIN_USERS_LIMIT } from "@/lib/constants";
import { useAdminListBase } from "@/hooks/use-admin-list-base";
import type { User } from "@/types";
import { queryKeys } from "@/lib/query-keys";

type BetterAuthAdminUser = NonNullable<
  Awaited<ReturnType<typeof authClient.admin.listUsers>>["data"]
>["users"][number];

export function toAdminUser(row: BetterAuthAdminUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    image: row.image ?? null,
    role: row.role ?? "user",
    banned: row.banned ?? null,
    banReason: row.banReason ?? null,
    emailVerified: row.emailVerified,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

interface UseAdminUsersOptions {
  currentUserId?: string;
}

export function useAdminUsers({ currentUserId }: UseAdminUsersOptions = {}) {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  const limit = ADMIN_USERS_LIMIT;

  const list = useAdminListBase<any>({
    baseKey: queryKeys.adminUsers(),
    queryFn: async ({ page, search }) => {
      const params: Record<string, string | number> = { limit, offset: (page - 1) * limit };
      if (search) {
        params.searchValue = search;
        params.searchField = "email";
        params.searchOperator = "contains";
      }
      const { data, error } = await authClient.admin.listUsers({ query: params });
      if (error) throw new Error(error.message || "Failed to fetch");
      const users = (data?.users ?? []).map(toAdminUser);
      const total = data?.total ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return {
        data: users,
        meta: {
          total,
          totalPages,
          page,
          limit,
          hasMore: page * limit < total,
        },
      };
    },
    defaultLimit: limit,
    defaultSorting: [{ id: "createdAt", desc: true }],
  });

  const handleSetRole = useCallback(async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" });
      toast.success(role === "admin" ? "User promoted to admin." : "Admin role removed.");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    } catch (err) {
      logger.error("admin-users", "Failed to set role", err);
      toast.error("Unable to update role.");
    } finally {
      setActionLoading(null);
    }
  }, [queryClient]);

  const handleBan = useCallback(async () => {
    if (!banTarget) return;
    setIsBanning(true);
    setActionLoading(banTarget.id);
    try {
      await authClient.admin.banUser({ userId: banTarget.id, banReason: banReason || undefined });
      toast.success("User banned.");
      setBanTarget(null);
      setBanReason("");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    } catch (err) {
      logger.error("admin-users", "Failed to ban user", err);
      toast.error("Unable to ban user.");
    } finally {
      setIsBanning(false);
      setActionLoading(null);
    }
  }, [banTarget, banReason, queryClient]);

  const handleUnban = useCallback(async (userId: string) => {
    setActionLoading(userId);
    try {
      await authClient.admin.unbanUser({ userId });
      toast.success("User unbanned.");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
    } catch (err) {
      logger.error("admin-users", "Failed to unban user", err);
      toast.error("Unable to unban user.");
    } finally {
      setActionLoading(null);
    }
  }, [queryClient]);

  return {
    page: list.page,
    setPage: list.setPage,
    search: list.search,
    setSearch: list.setSearch,
    users: list.items,
    total: list.total,
    totalPages: list.totalPages,
    limit,
    loading: list.loading,
    isError: list.isError,
    retry: list.retry,
    currentUserId,
    actionLoading,
    banTarget,
    setBanTarget,
    banReason,
    setBanReason,
    isBanning,
    handleSetRole,
    handleBan,
    handleUnban,
  };
}
