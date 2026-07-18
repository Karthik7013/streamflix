"use client"

import { useEffect, useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import { authClient } from "@/lib/auth-client"
import { logger } from "@/lib/logger"
import { STALE } from "@/lib/stale-times"
import { useDebounce } from "@/hooks/use-debounce"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { ItemCount } from "@/components/item-count"
import type { User } from "@/types"
import { UsersTable } from "@/app/admin/users-table"

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const queryClient = useQueryClient()

  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")
  const [isBanning, setIsBanning] = useState(false)

  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, debouncedSearch],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit, offset: (page - 1) * limit }
      if (debouncedSearch) {
        params.searchValue = debouncedSearch
        params.searchField = "email"
        params.searchOperator = "contains"
      }
      const { data, error } = await authClient.admin.listUsers({ query: params })
      if (error) throw new Error(error.message || "Failed to fetch")
      return data
    },
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  })

  const users = useMemo(() => (data?.users ?? []) as unknown as User[], [data?.users])
  const total = useMemo(() => data?.total ?? 0, [data?.total])
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  useEffect(() => {
    queueMicrotask(() => { if (debouncedSearch) setPage(1) })
  }, [debouncedSearch])

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" })
      toast.success(role === "admin" ? "User promoted to admin." : "Admin role removed.")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (err) {
      logger.error("admin-users", "Failed to set role", err)
      toast.error("Unable to update role.")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBan() {
    if (!banTarget) return
    setIsBanning(true)
    setActionLoading(banTarget.id)
    try {
      await authClient.admin.banUser({ userId: banTarget.id, banReason: banReason || undefined })
      toast.success("User banned.")
      setBanTarget(null)
      setBanReason("")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (err) {
      logger.error("admin-users", "Failed to ban user", err)
      toast.error("Unable to ban user.")
    } finally {
      setIsBanning(false)
      setActionLoading(null)
    }
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.unbanUser({ userId })
      toast.success("User unbanned.")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch (err) {
      logger.error("admin-users", "Failed to unban user", err)
      toast.error("Unable to unban user.")
    } finally {
      setActionLoading(null)
    }
  }

  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage user accounts and roles.</p>
      </div>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b bg-muted/10 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          <UsersTable
            users={users}
            loading={isLoading}
            currentUserId={currentUserId}
            actionLoading={actionLoading}
            onSetRole={handleSetRole}
            onBan={(u) => { setBanTarget(u); setBanReason("") }}
            onUnban={handleUnban}
          />
        </CardContent>
      </Card>

      <AlertDialog open={banTarget !== null} onOpenChange={(open) => { if (!open) setBanTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogTitle>Ban User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to ban{" "}
            <strong>{banTarget?.name}</strong>?
          </AlertDialogDescription>
          <div className="space-y-1.5 mt-4">
            <label className="text-sm font-medium">
              Ban Reason (optional)
            </label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter a reason..."
              className="min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <AlertDialogClose
              render={<Button variant="outline">Cancel</Button>}
            />
            <Button variant="destructive" onClick={handleBan} disabled={isBanning}>
              {isBanning && <Loader2Icon className="size-4 animate-spin mr-2" />}
              Ban User
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
