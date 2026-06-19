"use client"

import { useEffect, useState, useRef, useMemo, memo } from "react"
import Image from "next/image"
import { SearchIcon, Loader2Icon, ShieldCheckIcon, ShieldXIcon, BanIcon, UnlockIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/use-debounce"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
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

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [local, setLocal] = useState(value)
  const syncRef = useRef(onChange)
  syncRef.current = onChange

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timeout = setTimeout(() => syncRef.current(local), 300)
    return () => clearTimeout(timeout)
  }, [local])

  return (
    <div className="relative w-64">
      <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  )
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
  user: User
  currentUserId?: string
  actionLoading: string | null
  onSetRole: (userId: string, role: string) => void
  onBan: (user: User) => void
  onUnban: (userId: string) => void
  banTarget: User | null
  banReason: string
  setBanReason: (v: string) => void
  handleBan: () => void
}) {
  const isSelf = user.id === currentUserId
  return (
    <tr className="border-b last:border-0 hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {user.image ? (
            <Image src={user.image} alt={`${user.name}'s avatar`} width={32} height={32} className="size-8 rounded-full object-cover" />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            {isSelf && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">You</Badge>
            )}
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
                  <span className="sr-only">Make Admin</span>
                </Button>
              ) : (
                !isSelf && (
                  <Button variant="ghost" size="icon-sm" onClick={() => onSetRole(user.id, "user")} title="Remove admin">
                    <ShieldXIcon className="size-3.5" />
                    <span className="sr-only">Remove Admin</span>
                  </Button>
                )
              )}
              {isSelf || user.banned ? null : (
                <AlertDialog>
                  <AlertDialogTrigger onClick={() => onBan(user)}>
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
                      <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
                      <Button variant="destructive" onClick={handleBan}>Ban User</Button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {user.banned && !isSelf && (
                <Button variant="ghost" size="icon-sm" onClick={() => onUnban(user.id)} title="Unban">
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
})

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "ellipsis")[] = [1]
  if (current > 3) pages.push("ellipsis")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("ellipsis")
  pages.push(total)
  return pages
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")

  const fetchCount = useRef(0)

  useEffect(() => {
    const id = ++fetchCount.current
    const params: Record<string, string | number> = { limit: 20, offset: (page - 1) * 20 }
    if (debouncedSearch) {
      params.searchValue = debouncedSearch
      params.searchField = "email"
      params.searchOperator = "contains"
    }

    if (id === 1) setLoading(true)
    authClient.admin.listUsers({ query: params }).then(({ data, error }) => {
      if (id !== fetchCount.current) return
      if (error) throw new Error(error.message || "Failed to fetch")
      if (data) {
        setUsers(data.users as User[])
        setTotal(data.total)
        setTotalPages(Math.max(1, Math.ceil(data.total / 20)))
      }
    }).catch(() => {}).finally(() => {
      if (id === fetchCount.current) setLoading(false)
    })
  }, [page, debouncedSearch, version])

  useEffect(() => {
    if (debouncedSearch) setPage(1)
  }, [debouncedSearch])

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" })
      setVersion((v) => v + 1)
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
      setVersion((v) => v + 1)
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
      setVersion((v) => v + 1)
    } catch {
      // silent
    } finally {
      setActionLoading(null)
    }
  }

  const limit = 20
  const startItem = useMemo(() => (page - 1) * limit + 1, [page])
  const endItem = useMemo(() => Math.min(page * limit, total), [page, total])
  const pageNumbers = useMemo(() => getPageNumbers(page, totalPages), [page, totalPages])

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and roles.
          </p>
        </div>
      </div>

      <Card className="p-0 flex-1 flex flex-col min-h-0">
        <CardHeader className="pt-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          {loading ? (
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
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      currentUserId={currentUserId}
                      actionLoading={actionLoading}
                      onSetRole={handleSetRole}
                      onBan={(u) => { setBanTarget(u); setBanReason("") }}
                      onUnban={handleUnban}
                      banTarget={banTarget}
                      banReason={banReason}
                      setBanReason={setBanReason}
                      handleBan={handleBan}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        <div className="flex items-center justify-between p-4 border-t bg-muted/5 text-sm text-muted-foreground">
          <p className="hidden sm:block">
            Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-medium text-foreground">{endItem}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> users
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {pageNumbers.map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={p === page}
                      onClick={(e) => { e.preventDefault(); setPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                  className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  )
}
