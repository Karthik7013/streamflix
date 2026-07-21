"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { logger } from "@/lib/logger";
import { STALE } from "@/lib/stale-times";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "@/hooks/use-session";
import type { User } from "@/types";

export function useAdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banTarget, setBanTarget] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit, offset: (page - 1) * limit };
      if (debouncedSearch) {
        params.searchValue = debouncedSearch;
        params.searchField = "email";
        params.searchOperator = "contains";
      }
      const { data, error } = await authClient.admin.listUsers({ query: params });
      if (error) throw new Error(error.message || "Failed to fetch");
      return data;
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const users = useMemo(() => (data?.users ?? []) as unknown as User[], [data?.users]);
  const total = useMemo(() => data?.total ?? 0, [data?.total]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    queueMicrotask(() => { if (debouncedSearch) setPage(1); });
  }, [debouncedSearch]);

  const handleSetRole = useCallback(async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" });
      toast.success(role === "admin" ? "User promoted to admin." : "Admin role removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      logger.error("admin-users", "Failed to unban user", err);
      toast.error("Unable to unban user.");
    } finally {
      setActionLoading(null);
    }
  }, [queryClient]);

  return {
    page, setPage,
    search, setSearch,
    users, total, totalPages, limit,
    isLoading,
    currentUserId,
    actionLoading,
    banTarget, setBanTarget,
    banReason, setBanReason,
    isBanning,
    handleSetRole, handleBan, handleUnban,
  };
}
