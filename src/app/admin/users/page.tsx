"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { useDebounce } from "@/hooks/use-debounce"
import SearchInput from "../search-input"
import Pagination from "../pagination"
import UsersTable from "../users-table"

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
    queueMicrotask(() => { if (debouncedSearch) setPage(1) })
  }, [debouncedSearch])

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" })
      setVersion((v) => v + 1)
    } catch {} finally {
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
    } catch {} finally {
      setActionLoading(null)
    }
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.unbanUser({ userId })
      setVersion((v) => v + 1)
    } catch {} finally {
      setActionLoading(null)
    }
  }

  const limit = 20
  const startItem = useMemo(() => (page - 1) * limit + 1, [page])
  const endItem = useMemo(() => Math.min(page * limit, total), [page, total])

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">Manage user accounts and roles.</p>
      </div>

      <Card className="p-0 flex-1 flex flex-col min-h-0">
        <CardHeader className="pt-4">
          <div className="flex items-center justify-between">
            <CardTitle>All Users</CardTitle>
            <SearchInput value={search} onChange={setSearch} placeholder="Search by email..." />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 min-h-0">
          <UsersTable
            users={users}
            loading={loading}
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
        </CardContent>
        <div className="flex items-center justify-between p-4 border-t bg-muted/5 text-sm text-muted-foreground">
          <p className="hidden sm:block">
            Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
            <span className="font-medium text-foreground">{endItem}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> users
          </p>
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label="" />
    </div>
  )
}
