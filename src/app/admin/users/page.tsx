"use client"

import { useEffect, useState, useCallback } from "react"
import { SearchIcon, Loader2Icon, ShieldCheckIcon, ShieldXIcon, BanIcon, UnlockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import { authClient } from "@/lib/auth-client"

interface User {
  id: string
  name: string
  email: string
  image?: string | null
  role?: string
  banned: boolean | null
  banReason?: string | null
  banExpires?: Date | null
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [loading, setLoading] = useState(true)

  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { limit: 20, offset: (page - 1) * 20 }
      if (debouncedSearch) {
        params.searchValue = debouncedSearch
        params.searchField = "email"
        params.searchOperator = "contains"
      }
      const { data, error } = await authClient.admin.listUsers({ query: params })
      if (error) throw new Error(error.message || "Failed to fetch")
      if (data) {
        setUsers(data.users as User[])
        setTotal(data.total)
        setTotalPages(Math.max(1, Math.ceil(data.total / 20)))
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" })
      fetchUsers()
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  async function handleBan() {
    if (!banTarget) return
    setActionLoading(banTarget.id)
    try {
      await authClient.admin.banUser({ userId: banTarget.id, banReason: banReason || undefined })
      setBanTarget(null)
      setBanReason("")
      fetchUsers()
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.unbanUser({ userId })
      fetchUsers()
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const limit = 20
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and roles.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="relative w-64">
              <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No users found.
            </div>
          ) : (
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
                  {users.map((user) => {
                    const isSelf = user.id === currentUserId
                    return (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt=""
                                className="size-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                {user.name.charAt(0).toUpperCase()}
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
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={user.role === "admin" ? "default" : "secondary"}
                          >
                            {user.role || "user"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {user.banned ? (
                            <div className="flex items-center gap-1.5">
                              <Badge variant="destructive" className="text-[10px]">
                                Banned
                              </Badge>
                              {user.banReason && (
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={user.banReason}>
                                  {user.banReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {actionLoading === user.id ? (
                              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                {user.role !== "admin" ? (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleSetRole(user.id, "admin")}
                                    title="Make admin"
                                  >
                                    <ShieldCheckIcon className="size-3.5" />
                                    <span className="sr-only">Make Admin</span>
                                  </Button>
                                ) : (
                                  !isSelf && (
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => handleSetRole(user.id, "user")}
                                      title="Remove admin"
                                    >
                                      <ShieldXIcon className="size-3.5" />
                                      <span className="sr-only">Remove Admin</span>
                                    </Button>
                                  )
                                )}
                                {isSelf || user.banned ? null : (
                                  <AlertDialog>
                                    <AlertDialogTrigger onClick={() => { setBanTarget(user); setBanReason("") }}>
                                      <BanIcon className="size-3.5" />
                                      <span className="sr-only">Ban</span>
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
                                        <AlertDialogClose
                                          render={<Button variant="outline">Cancel</Button>}
                                          onClick={() => setBanTarget(null)}
                                        />
                                        <Button
                                          variant="destructive"
                                          onClick={handleBan}
                                        >
                                          Ban User
                                        </Button>
                                      </div>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                                {user.banned && !isSelf && (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleUnban(user.id)}
                                    title="Unban"
                                  >
                                    <UnlockIcon className="size-3.5" />
                                    <span className="sr-only">Unban</span>
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {startItem}–{endItem} of {total} users
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
