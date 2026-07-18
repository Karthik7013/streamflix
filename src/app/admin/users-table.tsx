"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ShieldCheckIcon, ShieldXIcon, BanIcon, UnlockIcon, Loader2Icon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

import type { User } from "@/types";

export function UsersTable({
  users,
  loading,
  currentUserId,
  actionLoading,
  onSetRole,
  onBan,
  onUnban,
}: {
  users: User[];
  loading: boolean;
  currentUserId?: string;
  actionLoading: string | null;
  onSetRole: (userId: string, role: string) => void;
  onBan: (user: User) => void;
  onUnban: (userId: string) => void;
}) {
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: "user",
        header: "User",
        accessorKey: "name",
        enableSorting: true,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;
          return (
            <div className="flex items-center gap-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt=""
                  width={32}
                  height={32}
                  sizes="32px"
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.name}</span>
                {isSelf && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    You
                  </Badge>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "email",
        header: "Email",
        accessorKey: "email",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        id: "verified",
        header: "Verified",
        cell: ({ row }) =>
          row.original.emailVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="size-3.5" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
              <X className="size-3.5" />
              Unverified
            </span>
          ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge
            variant={row.original.role === "admin" ? "default" : "secondary"}
          >
            {row.original.role || "user"}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.banned ? (
            <div className="flex items-center gap-1.5">
              <Badge variant="destructive" className="text-[10px]">
                Banned
              </Badge>
              {row.original.banReason && (
                <span
                  className="text-xs text-muted-foreground truncate max-w-[120px]"
                  title={row.original.banReason}
                >
                  {row.original.banReason}
                </span>
              )}
            </div>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] text-green-600 border-green-300"
            >
              Active
            </Badge>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === currentUserId;
          const isLoading = actionLoading === user.id;

          return (
            <div className="flex items-center justify-end gap-1">
              {isLoading ? (
                <Loader2Icon className="size-4 animate-spin text-primary" />
              ) : (
                <>
                  {user.role !== "admin" ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSetRole(user.id, "admin")}
                      title="Make admin"
                    >
                      <ShieldCheckIcon className="size-3.5" />
                    </Button>
                  ) : !isSelf ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSetRole(user.id, "user")}
                      title="Remove admin"
                    >
                      <ShieldXIcon className="size-3.5" />
                    </Button>
                  ) : null}
                  {!isSelf && !user.banned && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onBan(user)}
                      title="Ban user"
                    >
                      <BanIcon className="size-3.5" />
                    </Button>
                  )}
                  {user.banned && !isSelf && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onUnban(user.id)}
                      title="Unban"
                    >
                      <UnlockIcon className="size-3.5" />
                    </Button>
                  )}
                </>
              )}
            </div>
          );
        },
      },
    ],
    [
      currentUserId,
      actionLoading,
      onSetRole,
      onBan,
      onUnban,
    ]
  );

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage="No users found."
      manualSorting={false}
    />
  );
}
