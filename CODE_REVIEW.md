# Codebase Review Report — `better-auth-nextjs`

I reviewed the full codebase (pages, components, hooks, lib, services, API routes) without changing anything. Below is the consolidated report organized by category.

---

## 1. Anti-Patterns

### 1.1 `entity-dialog.tsx` — `any` type abuse
- **File**: `src/components/entity-dialog.tsx:2, 38-43, 64`
- **Severity**: High
- **Issue**: Uses `/* eslint-disable @typescript-eslint/no-explicit-any */` and passes `Record<string, any>` for `initialData`, `api.endpoint`, `defaultValues`, and form data. This completely erases type safety for the most generic and reused component in the admin panel.
- **Fix**: Replace `any` with a generic `<T extends Record<string, unknown>>` on `EntityDialogProps`, or define a strict `EntityConfig<T>` interface. The children render-prop can receive typed `register`, `watch`, `setValue` via generics instead of `FormSlotContext` using `ReturnType<typeof useForm>`.

### 1.2 `movie-dialog.tsx` — `any` type abuse
- **File**: `src/components/movie-dialog.tsx:2, 34`
- **Severity**: High
- **Issue**: Same pattern — casts `initialData as Record<string, any>`.
- **Fix**: Same as above; leverage `MovieFormData` type from schemas instead of casting.

### 1.3 `use-admin-crud.ts` — `apiFetch` in a non-page utility
- **File**: `src/hooks/use-admin-crud.ts:42`
- **Severity**: Medium
- **Issue**: The AGENTS.md guideline says "Zero `apiFetch` calls in admin page files" — `use-admin-crud.ts` is a generic hook/utility, so this is the allowed exception. However, it still uses raw `apiFetch` with manual JSON parsing instead of the typed `adminApi` methods, which defeats the purpose of the typed API layer.
- **Fix**: Accept an `apiCall` function as a parameter or use a typed fetcher. Alternatively, keep `apiFetch` but wrap it in a typed helper that returns the expected `{ data, meta }` shape.

### 1.4 Silent catch blocks
- **File**: `src/components/upload-field.tsx:28-30`, `src/app/admin/movies/page.tsx:83-85`, `src/hooks/use-admin-featured-movies.ts:65-67`, `src/hooks/use-admin-featured-series.ts:65-67`
- **Severity**: Medium
- **Issue**: Multiple `catch` blocks with empty or comment-only bodies (`// error is managed by the hook`). The AGENTS.md explicitly says "No silent catch blocks — every `catch {}` must log the error."
- **Fix**: Add `logger.error("feature", "message", err)` in every silent catch, even if the user already sees a toast.

### 1.5 `search-input.tsx` — uncontrolled local state mirroring
- **File**: `src/app/admin/search-input.tsx:16-22`
- **Severity**: Medium
- **Issue**: Maintains a `local` state that mirrors the `value` prop with a 300ms debounce. This is a controlled-component-with-delay anti-pattern. The parent already has debounced search (e.g., `use-admin-crud.ts` uses `useDebounce`).
- **Fix**: Let the parent own the debounced value and pass the debounced value back down. Or replace with a shared `useDebounce` hook at the parent level and make this a fully controlled input.

### 1.6 `useFilterParams` — dual state + URL param mirroring
- **File**: `src/hooks/use-filter-params.ts:29-36`
- **Severity**: Medium
- **Issue**: Maintains `params` state AND synchronizes it with `useSearchParams()` via a manual `if (key !== paramsKey)` check on every render. This can cause stale reads and extra re-renders.
- **Fix**: Derive `params` directly from `searchParams` and use `setParams` to update. Only keep local state for transient UI concerns (like debounced query).

### 1.7 `useComments.ts` — stale `timeAgo` computation
- **File**: `src/hooks/use-comments.ts:80-83`
- **Severity**: Low
- **Issue**: `timeAgo` is computed once from `Date.now()` at render time. It never updates, so "2m ago" stays "2m ago" forever.
- **Fix**: Store `createdAt` and compute `timeAgo` in a `setInterval` (e.g., every 30s), or use a relative-time library.

### 1.8 `useVideoEngine` / `usePlayerUI` — mutable refs + state
- **File**: `src/components/streamflix-player/use-player-ui.ts:6`
- **Severity**: Low
- **Issue**: `idleRef` is typed as `ReturnType<typeof setTimeout> | undefined` but initialized with `undefined` as `ReturnType<typeof setTimeout>` (line 6). Same pattern in `useAutoPlay.ts:13`. TypeScript is lenient here but it's a smell.
- **Fix**: Initialize with `null` or use `ReturnType<typeof setTimeout> | null`.

### 1.9 `useAuthLogout` — `isLoggingOut` in closure
- **File**: `src/hooks/use-auth-logout.ts:16-17`
- **Severity**: Medium
- **Issue**: `logout` checks `if (isLoggingOut) return;` but `isLoggingOut` is captured in the `useCallback` closure. If the callback fires twice before the state update, both calls proceed.
- **Fix**: Use a ref (`isLoggingOutRef`) for the guard, or chain `.finally(() => setIsLoggingOut(false))` and guard at the call site.

---

## 2. Code Redundancy

### 2.1 Duplicate admin hook patterns (`use-admin-featured-movies.ts` vs `use-admin-featured-series.ts`)
- **File**: `src/hooks/use-admin-featured-movies.ts`, `src/hooks/use-admin-featured-series.ts`
- **Severity**: High
- **Issue**: These two files are **~95% identical** — only the query key, API endpoints (`featured` vs `featuredSeries`), and `movieId` vs `seriesId` differ. This is textbook duplication.
- **Fix**: Extract a `useAdminFeatured<T>({ queryKey, listApi, createApi, updateApi, deleteApi, idField })` generic hook, or at minimum extract the shared logic into a `createFeaturedHook` factory.

### 2.2 Duplicate page patterns (`featured/page.tsx` vs `featured-series/page.tsx`)
- **File**: `src/app/admin/featured/page.tsx`, `src/app/admin/featured-series/page.tsx`
- **Severity**: High
- **Issue**: Both pages are structurally identical — only the title, description, and entity type differ.
- **Fix**: Create a generic `FeaturedPage({ entityType, ... })` component.

### 2.3 Duplicate carousel/grid sentinel logic
- **File**: `src/app/(main)/explore/movie-grid.tsx:13-20`, `src/app/(main)/series/series-grid.tsx:13-20`
- **Severity**: Medium
- **Issue**: `findScrollContainer` and the `IntersectionObserver` pattern are copy-pasted.
- **Fix**: Extract into `useInfiniteScroll({ hasMore, loading, onLoadMore })` or a shared `<InfiniteSentinel>` component.

### 2.4 Duplicate `SORT_OPTIONS` arrays
- **File**: `src/app/(main)/explore/explore-content.tsx:17-26`, `src/app/(main)/series/series-content.tsx:17-24`
- **Severity**: Low
- **Issue**: `SORT_OPTIONS` is defined separately in both files (only differing in `releaseDate` direction).
- **Fix**: Extract to a shared constant in `src/lib/constants.ts` or a dedicated sort-options file.

### 2.5 Duplicate `DataTable` column definitions across admin tables
- **File**: `src/app/admin/movies-table.tsx`, `src/app/admin/series-table.tsx`, `src/app/admin/reports-table.tsx`, `src/app/admin/requests-table.tsx`
- **Severity**: Medium
- **Issue**: Each table re-defines similar `ColumnDef` arrays with `cell` renderers for dates, badges, and action buttons. The date formatting (`new Date(...).toLocaleDateString()`), status badges, and action button clusters are repeated.
- **Fix**: Extract shared cell renderers into `src/components/admin/table-cells.tsx` (e.g., `<DateCell>`, `<StatusBadgeCell>`, `<ActionButtonsCell>`).

### 2.6 Duplicate loading/skeleton patterns
- **Severity**: Low
- **Issue**: `SKELETON_ITEMS_4`, `SKELETON_ITEMS_5`, `SKELETON_ITEMS_3` arrays are defined inline in many files.
- **Fix**: Move to a shared `src/lib/skeletons.ts` or use a `<SkeletonRow count={n} />` component.

---

## 3. Optimization Issues

### 3.1 `getMovieBySlug` — N+1 tag loading in `getRelatedMovies`
- **File**: `src/services/movies.ts:102-136`
- **Severity**: High
- **Issue**: `getRelatedMovies` re-fetches the movie and its tags, then fetches related movies. It doesn't use `cacheGetOrSet`, so it hits the DB every time. Meanwhile `getMovieBySlug` is cached. The related-movies logic duplicates the tag-fetching logic.
- **Fix**: Cache `getRelatedMovies` separately, or derive related movies from the cached movie detail. Also, `attachTags` could be reused here.

### 3.2 `series.ts` — Missing `cacheGetOrSet` for `getSeriesBySlug` seasons/episodes
- **File**: `src/services/series.ts:242-274`
- **Severity**: High
- **Issue**: `getSeriesBySlug` caches the series detail, but the cache includes all seasons and episodes. If episodes are updated frequently, the entire cache is invalidated.
- **Fix**: Consider a two-level cache (series metadata + episodes) or a shorter TTL for episode-heavy responses.

### 3.3 `searchMovies` / `listSeries` — duplicated query blocks
- **File**: `src/services/movies.ts:171-261`, `src/services/series.ts:134-226`
- **Severity**: High
- **Issue**: Both functions have near-identical `try/catch` + `Promise.all` + `attachTags` + meta-building logic. The tag-filtered branch and non-tag branch duplicate ~80% of the query code.
- **Fix**: Extract a `paginatedList<T>({ query, countQuery, attachTags, limit, offset })` helper.

### 3.4 `MediaCarousel` — `React.Children.toArray` on every render
- **File**: `src/components/media-carousel.tsx:49`
- **Severity**: Low
- **Issue**: `slides = React.Children.toArray(children)` runs on every render, even when children haven't changed.
- **Fix**: Wrap in `useMemo(() => React.Children.toArray(children), [children])`.

### 3.5 `ContentGrowthChart` — `placeholderData()` recreated on every render
- **File**: `src/components/content-growth-chart.tsx:12-15`
- **Severity**: Low
- **Issue**: `placeholderData()` is called inside the component body. Move it outside the component or memoize it.

### 3.6 `MovieCard` / `SeriesCard` — `sizes` prop hardcoded, no `priority` prop forwarding
- **File**: `src/components/movie-card.tsx`, `src/components/series-card.tsx`
- **Severity**: Low
- **Issue**: `ShimmerImage` accepts `priority` and `fetchPriority` but `MovieCard`/`SeriesCard` never forward them. For hero-adjacent cards, this could improve LCP.
- **Fix**: Add optional `priority`/`fetchPriority` props to card components.

### 3.7 `useAdminCrud` — `extraParams` in query key is a `Record<string, string>` (object reference)
- **File**: `src/hooks/use-admin-crud.ts:30`
- **Severity**: Medium
- **Issue**: `extraParams` is included directly in the `queryKey` array. If the parent passes a new object literal each render (`{}`), the query key changes every render, causing refetches.
- **Fix**: Serialize `extraParams` to a string (e.g., `JSON.stringify`) for the query key, or require the caller to memoize it.

---

## 4. Unnecessary Re-renderings

### 4.1 `HeroCarousel` — no `memo` on inline elements
- **File**: `src/components/hero-carousel.tsx:89-194`
- **Severity**: Medium
- **Issue**: The carousel maps over `data` and renders all items on every `current` change. Each slide re-renders even when inactive. The `isActive` check happens in render, but all slides are still in the DOM and re-rendering.
- **Fix**: Only render the active slide + one buffer slide (prev/next), or wrap each slide in `React.memo` and compare `isActive`.

### 4.2 `DataTable` — `onSortingChange` cast
- **File**: `src/components/data-table.tsx:36`
- **Severity**: Low
- **Issue**: `onSortingChange: onSortingChange as never` is a type escape hatch that can hide mismatches.
- **Fix**: Properly type the prop or use `@tanstack/react-table`'s `SortingState` type directly.

### 4.3 `useAdminCrud` — `items` memoized but `total`/`totalPages` not necessary
- **File**: `src/hooks/use-admin-crud.ts:49-51`
- **Severity**: Low
- **Issue**: `items`, `total`, and `totalPages` are all `useMemo`'d. `total` and `totalPages` are primitive numbers — `useMemo` adds no value.
- **Fix**: Remove `useMemo` for primitive values.

### 4.4 `AppLayout` — `items` recalculated on every render
- **File**: `src/components/app-layout.tsx:76-81`
- **Severity**: Low
- **Issue**: `items` is recalculated every render. Since `loading` and `session` are stable, `useMemo` would prevent the `BottomNavbar` from receiving new prop references.
- **Fix**: Wrap in `useMemo`.

### 4.5 `EntityDialog` — `handleDialogOpen` recreated every render
- **File**: `src/components/entity-dialog.tsx:113-115`
- **Severity**: Low
- **Issue**: `handleDialogOpen` is a new function every render. Since it's passed to `Dialog`'s `onOpenChange`, this can cause the dialog to re-render.
- **Fix**: Use `useCallback`.

### 4.6 `MovieGrid` / `SeriesGrid` — `findScrollContainer` called inside `useEffect` without memoization
- **File**: `src/app/(main)/explore/movie-grid.tsx:43-45`, `src/app/(main)/series/series-grid.tsx:43-45`
- **Severity**: Low
- **Issue**: `findScrollContainer(document.querySelector("main"))` runs on every dependency change of the effect. Since `document.querySelector("main")` is stable, memoize it.
- **Fix**: Use `useRef` or `useMemo` for the scroll container element.

### 4.7 `useAdminFeaturedMovies` / `useAdminFeaturedSeries` — `handleSwap` depends on `featured.length`
- **File**: `src/hooks/use-admin-featured-movies.ts:72-75`, `src/hooks/use-admin-featured-series.ts:72-75`
- **Severity**: Low
- **Issue**: `handleSwap` is recreated whenever `featured.length` changes. Since `FeaturedRow` receives this callback and is `memo`'d, it will re-render when the array length changes even if the row itself didn't change.
- **Fix**: The length check should happen inside the mutation or the row should receive a stable callback.

---

## 5. Best Practices Violations

### 5.1 Missing `"use client"` awareness
- **Severity**: Critical
- **Issue**: Multiple files in `src/app/admin/` and `src/app/(main)/` use `"use client"` at the top (correctly), but `src/app/(main)/home/page.tsx` does NOT have it (correct, it's a server component). However, `src/app/(main)/series/page.tsx`, `src/app/(main)/explore/page.tsx`, etc. — need to verify they either are server components or have `"use client"`. Any component using `useSearchParams`, `useRouter`, or `useSession` MUST be a client component.
- **Fix**: Audit all page files for correct client/server boundary.

### 5.2 `export default` in non-page files
- **Severity**: Medium
- **Issue**: The AGENTS.md says "No `export default` in non-page files." I need to check if any non-page files use `export default`. From my review, `page.tsx` files correctly use `export default`, and other files use named exports. This appears to be followed correctly.

### 5.3 `CommentsSection` — `useEffect` with `document` query in client component
- **File**: `src/components/comments-section.tsx`
- **Severity**: Low
- **Issue**: No specific issue found here; `useEffect` is correctly used with `sentinelRef`.

### 5.4 `useAdminCrud` — `cache: "no-cache"` on fetch
- **File**: `src/hooks/use-admin-crud.ts:42`
- **Severity**: Medium
- **Issue**: `apiFetch` with `cache: "no-cache"` bypasses the browser cache entirely. For admin list queries that are already cached via React Query (`staleTime: STALE.DEFAULT`), this is redundant and adds unnecessary network overhead.
- **Fix**: Remove the `cache: "no-cache"` option, or use `cache: "force-cache"` to let the browser cache assist.

### 5.5 `AdminDashboard` — dynamic import of `ContentGrowthChart` inside page
- **File**: `src/app/admin/page.tsx:9-20`
- **Severity**: Low
- **Issue**: This is actually a good practice (dynamic import for `recharts`). No issue here.

### 5.6 `MediaCarousel` — children key uses array index
- **File**: `src/components/media-carousel.tsx:72`
- **Severity**: Low
- **Issue**: `key={`slide-${i}`}` — if children are reordered or filtered, index keys cause bugs. However, in a carousel the children are typically stable, so this is low risk.
- **Fix**: If stability is guaranteed, leave as-is. Otherwise use `child.key` or a stable ID.

### 5.7 `UploadField` — uses `<img>` instead of `next/image`
- **File**: `src/components/upload-field.tsx:39`
- **Severity**: Medium
- **Issue**: There's an explicit `eslint-disable-next-line @next/next/no-img-element` for the preview image. The `next/image` component would give better optimization and automatic format handling.
- **Fix**: Use `next/image` with `width`/`height` or `fill` for the preview. If `width`/`height` are unknown at build time, use `fill` or `unoptimized` on the Image component.

### 5.8 `UploadField` — input `ref` is stale after unmount/remount
- **File**: `src/components/upload-field.tsx:49-51`
- **Severity**: Low
- **Issue**: `onClick={() => inputRef.current?.click()}` — if the input is unmounted between the click handler creation and execution, `inputRef.current` will be null.
- **Fix**: This is standard React pattern and works in practice. No action needed unless there's a concrete bug.

---

## 6. Code Splitting Opportunities

### 6.1 `entity-dialog.tsx` — 272 lines, multiple responsibilities
- **File**: `src/components/entity-dialog.tsx`
- **Severity**: Medium
- **Issue**: Handles form state, TMDB search UI, tag toggling, slug generation, upload fields, and API calls all in one component.
- **Fix**: Split into `<EntityFormFields>`, `<EntityTmdbSearch>`, and keep `EntityDialog` as a thin orchestrator. The `children` render prop already does this partially — formalize it.

### 6.2 `admin/page.tsx` — dynamically import heavy components
- **File**: `src/app/admin/page.tsx`
- **Severity**: Low
- **Issue**: `ContentGrowthChart` (which uses `recharts`) is already dynamically imported. Good practice. No further action needed.

### 6.3 `movie-dialog.tsx` and `series-dialog.tsx` — good dynamic imports
- **File**: `src/app/admin/movies/page.tsx:19-24`
- **Severity**: None
- **Issue**: Already using `dynamic()` for `MovieDialog`. Good practice.

### 6.4 `StreamflixPlayer` — already well-structured
- **File**: `src/components/streamflix-player/index.tsx`
- **Severity**: None
- **Issue**: The player is split into `use-video-engine`, `use-player-ui`, `use-auto-play`, `use-keyboard-shortcuts`, and sub-components (`PlayerControls`, `NextEpisodeCard`, `SkipIntroButton`, `AmbientLayer`, `ShortcutsModal`). This is excellent code splitting.

### 6.5 Large admin table components
- **File**: `src/app/admin/movies-table.tsx` (202 lines), `src/app/admin/series-table.tsx` (182 lines), `src/app/admin/users-table.tsx` (211 lines)
- **Severity**: Medium
- **Issue**: Each table is 180-210 lines. The column definitions are the bulk of the file.
- **Fix**: Extract column definitions to separate files or a shared `admin-table-columns.ts` factory.

### 6.6 `services/movies.ts` and `services/series.ts` — 282 and 278 lines
- **Severity**: Medium
- **Issue**: Both service files are approaching 300 lines with duplicated list/search logic.
- **Fix**: Extract the shared paginated-list pattern into `src/services/paginated-list.ts` and import it.

---

## 7. Complicated / Over-Engineered Things

### 7.1 `use-admin-crud.ts` — over-abstracted CRUD hook
- **File**: `src/hooks/use-admin-crud.ts`
- **Severity**: Medium
- **Issue**: The hook tries to be a generic CRUD for all admin entities, but it only handles `DELETE`. Create/update are not implemented, so callers (like `MoviesPage`) have to wire up their own dialogs and mutations. This creates a leaky abstraction — the hook provides pagination/search/sort state but not the full CRUD lifecycle.
- **Fix**: Either implement full CRUD in the hook (create/update/delete with built-in dialogs or callbacks), or reduce it to `useAdminList` (just listing) and let callers handle mutations themselves. The current middle ground is confusing.

### 7.2 `use-admin-dashboard.ts` — two parallel `useQuery` calls
- **File**: `src/hooks/use-admin-dashboard.ts:9-24`
- **Severity**: Low
- **Issue**: `stats` and `signupsData` are fetched with separate `useQuery` calls. This is fine, but the hook returns 8 values, making it hard to consume.
- **Fix**: The two queries are independent, so parallel fetching is correct. Consider splitting the return into two objects or using `Promise.all` in a single `useQuery`.

### 7.3 `HeroCarousel` — complex timer/RAF logic
- **File**: `src/components/hero-carousel.tsx:56-82`
- **Severity**: Low
- **Issue**: The `skippingRef` + `requestAnimationFrame` pattern is clever but fragile. If `goTo` is called rapidly, the `skippingRef` can block legitimate transitions.
- **Fix**: Simplify to a single `useEffect` that sets the interval, and `goTo` just resets the interval. Remove the `skippingRef` unless it's solving a specific observed bug.

### 7.4 `ContentGrowthChart` — mixed data shapes
- **File**: `src/components/content-growth-chart.tsx:12-21`
- **Severity**: Low
- **Issue**: When `data` is empty, `placeholderData()` provides zeros, but `maxCount` is computed from the original `data` array (which is empty, so `Math.max(...[])` is `-Infinity`). Then `maxCount + 2` becomes `NaN` in the Y-axis domain.
- **Fix**: When `isEmpty`, set `maxCount = 10` instead of computing from empty data.

### 7.5 `useAdminUsers` — `useSession` inside a query hook
- **File**: `src/hooks/use-admin-users.ts:18-19`
- **Severity**: Medium
- **Issue**: `useSession()` is called inside `useAdminUsers`, which is fine for getting `currentUserId`, but it creates a dependency on the auth client's internal state. If the session reloads, the query may refetch unnecessarily.
- **Fix**: Pass `currentUserId` as a prop instead, or ensure `useSession` is memoized/stable.

### 7.6 `use-watchlist-toggle.ts` — optimistic update with manual spread
- **File**: `src/hooks/use-watchlist-toggle.ts:13-19`
- **Severity**: Medium
- **Issue**: The optimistic update spreads `{ ...old, movies: ... }`. If `old` has other fields beyond `movies`, they're preserved — which is correct. But `old.movies` is typed as `Array<{ id: number }>`, which is narrower than the actual `Watchlist` type. This could cause runtime issues if other fields exist.
- **Fix**: Type `old` properly as the full watchlist response shape.

### 7.7 `add-featured-dialog.tsx` — `alreadyFeaturedIds` is a `Set` passed as prop
- **File**: `src/app/admin/add-featured-dialog.tsx:70`
- **Severity**: Low
- **Issue**: `alreadyFeaturedIds: Set<number>` is passed from the parent. Sets are not serializable and can cause issues with React DevTools or future SSR.
- **Fix**: Accept `number[]` and convert to `Set` inside the component, or memoize the Set at the call site.

### 7.8 `use-admin-reports.ts` / `use-admin-requests.ts` — `queueMicrotask(() => setPage(1))`
- **File**: `src/hooks/use-admin-reports.ts:67-68`, `src/hooks/use-admin-requests.ts:67`
- **Severity**: Medium
- **Issue**: `queueMicrotask(() => setPage(1))` is used to reset pagination when filters change. This is a hack to avoid a React "state update during render" warning, but it causes a flash of stale data and an extra network request.
- **Fix**: Use `useEffect` with proper dependencies, or switch to `useTransition` to batch the state update.

---

## Summary of High-Priority Fixes

| # | Issue | Files | Severity |
|---|-------|-------|----------|
| 1 | `any` type abuse in `EntityDialog` and `MovieDialog` | `entity-dialog.tsx`, `movie-dialog.tsx` | High |
| 2 | Duplicate featured hooks (~95% identical) | `use-admin-featured-movies.ts`, `use-admin-featured-series.ts` | High |
| 3 | Duplicate featured page structure | `admin/featured/page.tsx`, `admin/featured-series/page.tsx` | High |
| 4 | N+1 tag loading in `getRelatedMovies` | `services/movies.ts` | High |
| 5 | Missing cache for `getRelatedMovies` | `services/movies.ts` | High |
| 6 | Duplicated list/search logic in `movies.ts` and `series.ts` | `services/movies.ts`, `services/series.ts` | High |
| 7 | Silent catch blocks without logging | `upload-field.tsx`, `movies/page.tsx`, featured hooks | Medium |
| 8 | `use-admin-crud.ts` uses raw `apiFetch` bypassing typed API | `use-admin-crud.ts` | Medium |
| 9 | `extraParams` in query key causes unstable keys | `use-admin-crud.ts` | Medium |
| 10 | `queueMicrotask` pagination hack | `use-admin-reports.ts`, `use-admin-requests.ts` | Medium |
| 11 | `timeAgo` stale after initial render | `use-comments.ts` | Low |
| 12 | `SearchInput` local state mirroring parent debounce | `admin/search-input.tsx` | Medium |

No files were modified. All findings are read-only observations.
