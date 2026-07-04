"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"
import { STALE } from "@/lib/stale-times"
import { useDebounce } from "@/hooks/use-debounce"
import dynamic from "next/dynamic"
import SearchInput from "../search-input"
import Pagination from "../pagination"
import { ItemCount } from "@/components/item-count"

const UsersTable = dynamic(() => import("../users-table"), {
  loading: () => (
    <div className="divide-y">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-none" />
      ))}
    </div>
  ),
})

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
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const queryClient = useQueryClient()

  const { data: session } = authClient.useSession()
  const currentUserId = session?.user?.id

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banTarget, setBanTarget] = useState<User | null>(null)
  const [banReason, setBanReason] = useState("")

  const limit = 20

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

  const users = (data?.users ?? []) as User[]
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    queueMicrotask(() => { if (debouncedSearch) setPage(1) })
  }, [debouncedSearch])

  async function handleSetRole(userId: string, role: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.setRole({ userId, role: role as "user" | "admin" })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
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
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch {} finally {
      setActionLoading(null)
    }
  }

  async function handleUnban(userId: string) {
    setActionLoading(userId)
    try {
      await authClient.admin.unbanUser({ userId })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    } catch {} finally {
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
            banTarget={banTarget}
            banReason={banReason}
            setBanReason={setBanReason}
            handleBan={handleBan}
          />
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} label={<ItemCount from={startItem} to={endItem} total={total} />} />
    </div>
  )
}
