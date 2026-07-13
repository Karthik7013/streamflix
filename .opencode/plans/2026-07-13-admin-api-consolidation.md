# Admin API Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `getAdminSeriesById` bug and complete the typed `adminApi` client, migrating all remaining `apiFetch` calls in admin pages.

**Architecture:** 8 files changed across 3 layers: (1) bug fix in service layer, (2) client method expansion in `adminApi`, (3) page-level migration in 6 admin page components. Each page migration is independent.

**Tech Stack:** Next.js 16, TypeScript, TanStack React Query, Drizzle ORM

---

### Task 1: Fix `getAdminSeriesById` missing return

**Files:**
- Modify: `src/services/series.ts:345-349`

- [ ] **Add the missing return statement**

The function fetches a series row, null-checks it, but never returns. Add `return seriesRow;`:

```typescript
export async function getAdminSeriesById(id: number) {
  const [seriesRow] = await db.select().from(series).where(eq(series.id, id)).limit(1);
  if (!seriesRow) return null;
  return seriesRow;
}
```

---

### Task 2: Expand `adminApi` client

**Files:**
- Modify: `src/lib/api/admin.ts`

- [ ] **Add type imports and admin-specific types**

Add `Movie`, `Series`, `Episode` to the import and define local types for admin response shapes:

```typescript
import type { Tag, PaginationMeta, MovieRequest, Report, Movie, Series, Episode } from "@/types";

interface AdminFeaturedItem {
  id: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}

interface AdminSeason {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string | null;
  description: string | null;
  episodeCount?: number;
}

interface AdminSearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
}
```

- [ ] **Add `featured` namespace**

Insert after `mostFavorited`:

```typescript
featured: {
  list: () =>
    api<{ data: (AdminFeaturedItem & { movieId: number })[] }>("/api/admin/featured"),

  create: (body: { movieId: number }) =>
    api<void>("/api/admin/featured", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: { displayOrder: number }) =>
    api<void>(`/api/admin/featured/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    api<void>(`/api/admin/featured/${id}`, { method: "DELETE" }),
},
```

- [ ] **Add `featuredSeries` namespace**

```typescript
featuredSeries: {
  list: () =>
    api<{ data: (AdminFeaturedItem & { seriesId: number })[] }>("/api/admin/featured-series"),

  create: (body: { seriesId: number }) =>
    api<void>("/api/admin/featured-series", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: number, body: { displayOrder: number }) =>
    api<void>(`/api/admin/featured-series/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: number) =>
    api<void>(`/api/admin/featured-series/${id}`, { method: "DELETE" }),
},
```

- [ ] **Add `movies` namespace (search only)**

```typescript
movies: {
  search: (params: URLSearchParams) =>
    api<{ data: AdminSearchResult[]; meta: PaginationMeta }>(`/api/admin/movies?${params}`),
},
```

- [ ] **Add `series` namespace (admin detail + search)**

```typescript
series: {
  getById: (id: number) =>
    api<{ data: Series }>(`/api/admin/series/${id}`),

  search: (params: URLSearchParams) =>
    api<{ data: AdminSearchResult[]; meta: PaginationMeta }>(`/api/admin/series?${params}`),
},
```

- [ ] **Add `seasons` namespace**

```typescript
seasons: {
  list: (seriesId: number) =>
    api<{ data: AdminSeason[] }>(`/api/admin/series/${seriesId}/seasons`),

  create: (seriesId: number, body: { seasonNumber?: number; title?: string }) =>
    api<void>(`/api/admin/series/${seriesId}/seasons`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (seriesId: number, id: number, body: { seasonNumber?: number; title?: string }) =>
    api<void>(`/api/admin/series/${seriesId}/seasons/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (seriesId: number, id: number) =>
    api<void>(`/api/admin/series/${seriesId}/seasons/${id}`, { method: "DELETE" }),
},
```

- [ ] **Add `episodes` namespace**

```typescript
episodes: {
  list: (seriesId: number, seasonId: number) =>
    api<{ data: Episode[] }>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes`),

  create: (seriesId: number, seasonId: number, body: Record<string, unknown>) =>
    api<void>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (seriesId: number, seasonId: number, id: number, body: Record<string, unknown>) =>
    api<void>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (seriesId: number, seasonId: number, id: number) =>
    api<void>(`/api/admin/series/${seriesId}/seasons/${seasonId}/episodes/${id}`, { method: "DELETE" }),
},
```

- [ ] **Extend `requests` with fulfill/delete**

Replace existing `requests: { list: ... }` with:

```typescript
requests: {
  list: (params: URLSearchParams) =>
    api<{ data: MovieRequest[]; meta: PaginationMeta }>(`/api/admin/requests?${params}`),

  fulfill: (id: number) =>
    api<void>(`/api/admin/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "fulfilled" }),
    }),

  delete: (id: number) =>
    api<void>(`/api/admin/requests/${id}`, { method: "DELETE" }),
},
```

- [ ] **Extend `reports` with resolve/delete**

Replace existing `reports: { list: ... }` with:

```typescript
reports: {
  list: (params: URLSearchParams) =>
    api<{ data: Report[]; meta: PaginationMeta }>(`/api/admin/reports?${params}`),

  resolve: (id: number, status: "pending" | "resolved") =>
    api<void>(`/api/admin/reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: number) =>
    api<void>(`/api/admin/reports/${id}`, { method: "DELETE" }),
},
```

---

### Task 3: Migrate `featured/page.tsx`

**Files:**
- Modify: `src/app/admin/featured/page.tsx`

- [ ] **Remove `import { apiFetch }`** (line 7)

- [ ] **Replace the list query (lines 24-34)**

```typescript
const { data: featured = [], isLoading } = useQuery<FeaturedMovie[]>({
  queryKey: ["admin-featured"],
  queryFn: async () => {
    const { data } = await adminApi.featured.list();
    return data;
  },
  staleTime: STALE.DEFAULT,
  refetchOnMount: false,
});
```

- [ ] **Replace `removeFeaturedMutation` mutationFn (line 37-39)**

```typescript
mutationFn: async (id: number) => {
  await adminApi.featured.delete(id);
},
```

- [ ] **Replace `swapItemsMutation` mutationFn (lines 54-69)**

```typescript
mutationFn: async ({ index, direction }: { index: number; direction: "up" | "down" }) => {
  const current = queryClient.getQueryData<FeaturedMovie[]>(["admin-featured"]) || [];
  const swapIdx = direction === "up" ? index - 1 : index + 1;
  await Promise.all([
    adminApi.featured.update(current[index].id, { displayOrder: current[swapIdx].displayOrder }),
    adminApi.featured.update(current[swapIdx].id, { displayOrder: current[index].displayOrder }),
  ]);
},
```

---

### Task 4: Migrate `featured-series/page.tsx`

**Files:**
- Modify: `src/app/admin/featured-series/page.tsx`

- [ ] **Remove `import { apiFetch }`** (line 7)

- [ ] **Replace list query** — use `adminApi.featuredSeries.list()`, return `data`
- [ ] **Replace remove mutation** — use `adminApi.featuredSeries.delete(id)`
- [ ] **Replace swap mutation** — use `adminApi.featuredSeries.update(id, { displayOrder })`

Same pattern as Task 3, just `featuredSeries` instead of `featured`.

---

### Task 5: Migrate `add-featured-dialog.tsx`

**Files:**
- Modify: `src/app/admin/add-featured-dialog.tsx`

- [ ] **Remove `import { apiFetch }`** (line 17)
- [ ] **Add `import { adminApi } from "@/lib/api/admin"`**

- [ ] **Replace search query (lines 77-88)**

Branch on `entityIdField` prop to call the correct adminApi method:

```typescript
const { data: searchResults = [], isFetching: searching } = useQuery<SearchResult[]>({
  queryKey: [searchEndpoint, searchQuery],
  queryFn: async () => {
    if (!searchQuery.trim()) return [];
    const params = new URLSearchParams({ search: searchQuery.trim(), limit: "10" });
    const result = entityIdField === "movieId"
      ? await adminApi.movies.search(params)
      : await adminApi.series.search(params);
    return result.data;
  },
  enabled: !!searchQuery,
  staleTime: STALE.FAST,
});
```

- [ ] **Replace add mutation (lines 90-98)**

```typescript
const addMutation = useMutation({
  mutationFn: async (id: number) => {
    if (entityIdField === "movieId") {
      await adminApi.featured.create({ movieId: id });
    } else {
      await adminApi.featuredSeries.create({ seriesId: id });
    }
  },
  onSuccess: () => {
    setSearchQuery("");
    onOpenChange(false);
    onSuccess?.();
  },
});
```

---

### Task 6: Migrate `requests/page.tsx`

**Files:**
- Modify: `src/app/admin/requests/page.tsx`

- [ ] **Remove `import { apiFetch }`** (line 10) if no other usage remains
- [ ] **Replace fulfill mutation mutationFn (line 77-84)**

```typescript
mutationFn: async (id: number) => {
  await adminApi.requests.fulfill(id);
},
```

- [ ] **Replace delete mutation mutationFn (line 89-92)**

```typescript
mutationFn: async (id: number) => {
  await adminApi.requests.delete(id);
},
```

---

### Task 7: Migrate `reports/page.tsx`

**Files:**
- Modify: `src/app/admin/reports/page.tsx`

- [ ] **Remove `import { apiFetch }`** (line 15) if no other usage remains
- [ ] **Replace resolve mutation mutationFn (lines 73-80)**

```typescript
mutationFn: async ({ id, status }: { id: number; status: "pending" | "resolved" }) => {
  await adminApi.reports.resolve(id, status);
},
```

- [ ] **Replace delete mutation mutationFn (lines 87-90)**

```typescript
mutationFn: async (id: number) => {
  await adminApi.reports.delete(id);
},
```

---

### Task 8: Migrate `series/[id]/page.tsx`

**Files:**
- Modify: `src/app/admin/series/[id]/page.tsx`

- [ ] **Remove `import { apiFetch }`** (line 14)
- [ ] **Add `import { adminApi } from "@/lib/api/admin"`**

- [ ] **Replace series detail query (lines 40-47)**

Return unwrapped `data` so `series` is the raw series object:

```typescript
const { data: series, isLoading, isError, refetch } = useQuery({
  queryKey: ["admin-series-detail", id],
  queryFn: async () => {
    const { data } = await adminApi.series.getById(Number(id));
    return data;
  },
});
```

- [ ] **Replace seasons query (lines 49-56)**

Rename to `seasons` (not `seasonsData`) and return unwrapped data:

```typescript
const { data: seasons, refetch: refetchSeasons } = useQuery({
  queryKey: ["admin-series-seasons", id],
  queryFn: async () => {
    const { data } = await adminApi.seasons.list(Number(id));
    return data;
  },
});
```

- [ ] **Replace episodes query (lines 58-67)**

Rename to `episodes` and return unwrapped data:

```typescript
const { data: episodes, refetch: refetchEpisodes } = useQuery({
  queryKey: ["admin-season-episodes", expandedSeason],
  queryFn: async () => {
    if (!expandedSeason) return [];
    const { data } = await adminApi.episodes.list(Number(id), expandedSeason);
    return data;
  },
  enabled: !!expandedSeason,
});
```

- [ ] **Fix fallback variables (lines 153-154)**

Remove the old reassignment since queries now return arrays directly:

```typescript
// Remove these two lines:
// const seasons = seasonsData?.seasons || []
// const episodes = episodesData?.episodes || []
```

- [ ] **Replace season save mutation (lines 69-94)**

```typescript
const saveSeasonMutation = useMutation({
  mutationFn: async (data: { seasonNumber?: number; title?: string }) => {
    if (editingSeason) {
      await adminApi.seasons.update(Number(id), editingSeason.id, data);
    } else {
      await adminApi.seasons.create(Number(id), data);
    }
  },
  onSuccess: () => {
    toast.success(editingSeason ? "Season updated." : "Season created.");
    setSeasonDialogOpen(false);
    setEditingSeason(null);
    refetchSeasons();
  },
  onError: () => toast.error("Unable to save season."),
});
```

- [ ] **Replace season delete mutation (lines 96-106)**

```typescript
const deleteSeasonMutation = useMutation({
  mutationFn: async (seasonId: number) => {
    await adminApi.seasons.delete(Number(id), seasonId);
  },
  onSuccess: () => {
    toast.success("Season deleted.");
    refetchSeasons();
  },
  onError: () => toast.error("Unable to delete season."),
});
```

- [ ] **Replace episode save mutation (lines 108-135)**

```typescript
const saveEpisodeMutation = useMutation({
  mutationFn: async (data: Record<string, unknown>) => {
    const seasonId = activeSeasonId!;
    if (editingEpisode) {
      await adminApi.episodes.update(Number(id), seasonId, editingEpisode.id, data);
    } else {
      await adminApi.episodes.create(Number(id), seasonId, data);
    }
  },
  onSuccess: () => {
    toast.success(editingEpisode ? "Episode updated." : "Episode created.");
    setEpisodeDialogOpen(false);
    setEditingEpisode(null);
    if (expandedSeason) refetchEpisodes();
  },
  onError: () => toast.error("Unable to save episode."),
});
```

- [ ] **Replace episode delete mutation (lines 137-148)**

```typescript
const deleteEpisodeMutation = useMutation({
  mutationFn: async (episodeId: number) => {
    if (!expandedSeason) return;
    await adminApi.episodes.delete(Number(id), expandedSeason, episodeId);
  },
  onSuccess: () => {
    toast.success("Episode deleted.");
    if (expandedSeason) refetchEpisodes();
  },
  onError: () => toast.error("Unable to delete episode."),
});
```

---

### Task 9: Build verification

- [ ] **Run the build**

```bash
npm run build
```

Expected: zero TypeScript errors, successful compilation.

- [ ] **Confirm zero remaining `apiFetch` in admin**

Expected: zero matches across all admin files.
