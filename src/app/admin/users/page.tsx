"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import { SearchInput } from "@/app/admin/search-input"
import { Pagination } from "@/app/admin/pagination"
import { ItemCount } from "@/components/item-count"
import { UsersTable } from "@/app/admin/users-table"
import { useAdminUsers } from "@/hooks/use-admin-users"

export default function AdminUsersPage() {
  const {
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
  } = useAdminUsers()

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
