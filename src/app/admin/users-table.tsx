"use client";

import { memo } from "react";
import Image from "next/image";
import { ShieldCheckIcon, ShieldXIcon, BanIcon, UnlockIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  banned: boolean | null;
  banReason?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserRow = memo(function UserRow({
  user,
  currentUserId,
  actionLoading,
  onSetRole,
  onBan,
  onUnban,
  banTarget,
  banReason,
  setBanReason,
  handleBan,
}: {
  user: User;
  currentUserId?: string;
  actionLoading: string | null;
  onSetRole: (userId: string, role: string) => void;
  onBan: (user: User) => void;
  onUnban: (userId: string) => void;
  banTarget: User | null;
  banReason: string;
  setBanReason: (v: string) => void;
  handleBan: () => void;
}) {
  const isSelf = user.id === currentUserId;
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.image ? (
            <Image src={user.image} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            {isSelf && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">You</Badge>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role || "user"}</Badge>
      </td>
      <td className="px-4 py-3">
        {user.banned ? (
          <div className="flex items-center gap-1.5">
            <Badge variant="destructive" className="text-[10px]">Banned</Badge>
            {user.banReason && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={user.banReason}>{user.banReason}</span>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">Active</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {actionLoading === user.id ? (
            <Loader2Icon className="size-4 animate-spin text-primary" />
          ) : (
            <>
              {user.role !== "admin" ? (
                <Button variant="ghost" size="icon-sm" onClick={() => onSetRole(user.id, "admin")} title="Make admin">
                  <ShieldCheckIcon className="size-3.5" />
                </Button>
              ) : !isSelf ? (
                <Button variant="ghost" size="icon-sm" onClick={() => onSetRole(user.id, "user")} title="Remove admin">
                  <ShieldXIcon className="size-3.5" />
                </Button>
              ) : null}
              {!isSelf && !user.banned && (
                <AlertDialog>
                  <AlertDialogTrigger onClick={() => onBan(user)}>
                    <BanIcon className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Ban User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to ban <strong>{banTarget?.name}</strong>?
                    </AlertDialogDescription>
                    <div className="space-y-1.5 mt-4">
                      <label className="text-sm font-medium">Ban Reason (optional)</label>
                      <textarea
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder="Enter a reason..."
                        className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 resize-y min-h-[80px]"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                      <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
                      <Button variant="destructive" onClick={handleBan}>Ban User</Button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {user.banned && !isSelf && (
                <Button variant="ghost" size="icon-sm" onClick={() => onUnban(user.id)} title="Unban">
                  <UnlockIcon className="size-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

export default function UsersTable({
  users,
  loading,
  currentUserId,
  actionLoading,
  onSetRole,
  onBan,
  onUnban,
  banTarget,
  banReason,
  setBanReason,
  handleBan,
}: {
  users: User[];
  loading: boolean;
  currentUserId?: string;
  actionLoading: string | null;
  onSetRole: (userId: string, role: string) => void;
  onBan: (user: User) => void;
  onUnban: (userId: string) => void;
  banTarget: User | null;
  banReason: string;
  setBanReason: (v: string) => void;
  handleBan: () => void;
}) {
  if (loading) {
    return (
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0" />
            <Skeleton className="h-5 w-14 shrink-0" />
            <div className="flex gap-1 shrink-0">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No users found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              actionLoading={actionLoading}
              onSetRole={onSetRole}
              onBan={onBan}
              onUnban={onUnban}
              banTarget={banTarget}
              banReason={banReason}
              setBanReason={setBanReason}
              handleBan={handleBan}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
