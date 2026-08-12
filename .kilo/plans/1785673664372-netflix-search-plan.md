# Netflix-Style Unified Search — Implementation Plan

## Goal
Replace the separate `/explore` (movies) and `/series/explore` (series) pages with a single `/search` experience: autocomplete dropdown from the bottom nav, unified results page with faceted filters, mixed movie/series results.

---

## Locked Decisions

| Decision | Choice |
|----------|--------|
| Tables | Keep `movies` and `series` separate; merge in service layer |
| FTS | Hybrid: `tsvector` generated columns + `ILIKE` fallback on title/description |
| Results display | Mixed scrollable list with "Movie"/"Series" badges + type filter tabs |
| Facets | Tags (AND), Year range, Language, Type tabs, Sort. Skip duration (series has no `durationSeconds`) and rating (no column) |
| Nav | Replace "Explore" with "Search" in bottom nav |
| Autocomplete | Portal at `document.body`, closes on outside tap + scroll |
| Search history | `localStorage` (10 items, client-side) |
| Caching | `cacheGetOrSet` 60s TTL on search queries; Redis invalidation scope `search:*` |

---

## Phase 1 — Schema Migration

**File:** `src/db/schema.ts`

1. Add `tsvector` generated column to `movies` and `series`:
   - Weights: `title` = A, `description` = B, `original_language` = C
   - Use `setweight(to_tsvector('english', coalesce(...)), 'A')` pattern
2. Add GIN index on `search_vector` for both tables
3. Add GIN trigram index on `description` for `ILIKE` fallback
4. Run `npm run db:generate` → review SQL → `npm run db:migrate`
5. Validate: `SELECT title, search_vector FROM movies LIMIT 5` shows populated vectors

---

## Phase 2 — Unified Search Service

**New file:** `src/services/search.ts`

```ts
export interface UnifiedSearchResult {
  id: number; type: "movie" | "series"; title: string; slug: string;
  thumbnailUrl: string; description: string | null; releaseDate: string | null;
  originalLanguage: string | null; durationSeconds: number | null;
  tags: { id: number; name: string }[]; relevanceRank?: number;
}

export interface UnifiedSearchResponse {
  data: UnifiedSearchResult[]; meta: {
    page: number; limit: number; total: number; totalPages: number;
    hasMore: boolean; movieCount: number; seriesCount: number;
  };
}

export async function unifiedSearch(args: {
  q?: string; type?: "all" | "movie" | "series";
  tagsParam?: string; yearMin?: number; yearMax?: number;
  languages?: string[]; page?: number; limit?: number;
  sortBy?: string; sortDir?: "asc" | "desc";
}): Promise<UnifiedSearchResponse>
```

- Refactor `searchMovies()` in `src/services/movies.ts` and `listSeries()` in `src/services/series.ts` to accept `yearMin`/`yearMax`/`languages` filters (add as optional params, don't break existing callers)
- `unifiedSearch()` runs parallel queries based on `type` filter, tags each result with `type`, merges, sorts by FTS rank then `releaseDate DESC`
- Wrap in `cacheGetOrSet` with key `search:${JSON.stringify({...args, page})}`, TTL: 60s if `q` present, 300s otherwise

---

## Phase 3 — API Routes

**New file:** `src/app/api/search/route.ts`
- `GET /api/search?q=...&type=all&tags=1,2&yearMin=2020&yearMax=2024&languages=en&page=1&limit=12&sortBy=relevance&sortDir=desc`
- Auth: `withPublic`
- Return `{ data, meta }` shape matching existing list endpoints
- Header: `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`

**New file:** `src/app/api/search/suggestions/route.ts`
- `GET /api/search/suggestions?q=harry&limit=6`
- Auth: `withPublic`
- Lightweight query: search `title` via FTS `@@` + `ILIKE` fallback, return `[{ title, slug, type }]`
- Header: `Cache-Control: public, s-maxage=30`

---

## Phase 4 — API Client

**New file:** `src/lib/api/search.ts`

```ts
export const searchApi = {
  search: (params: URLSearchParams) => apiFetch<UnifiedSearchResponse>("/api/search", { params }),
  suggestions: (params: URLSearchParams) => apiFetch<Suggestion[]>("/api/search/suggestions", { params }),
};
```

---

## Phase 5 — React Query Hooks

**New file:** `src/hooks/use-unified-search.ts`
- `useInfiniteQuery` with key `["unified-search", q, type, selectedTags, yearMin, yearMax, languages, sortBy, sortDir]`
- `getNextPageParam` from `hasMore`
- `staleTime: STALE.DEFAULT`, `refetchOnMount: false`

**New file:** `src/hooks/use-search-suggestions.ts`
- `useQuery` (not infinite), key `["suggestions", q]`
- `enabled` only when `q.length >= 2`
- `staleTime: STALE.FAST` (120s)

**New file:** `src/hooks/use-search-history.ts`
- Read/write `localStorage` key `search-history`, max 10 items
- `addToHistory(query)`, `clearHistory()`

---

## Phase 6 — Autocomplete Component

**New file:** `src/components/search-autocomplete.tsx`

```tsx
"use client";
// Props: value, onChange, onNavigate (closes dropdown, navigates to /search)
```

- Renders via `createPortal` to `document.body`
- Debounces input at 150ms, fires `useSearchSuggestions`
- Dropdown anchored below input, `z-[100]`
- Keyboard nav: ↑↓ active index, Enter selects, Escape closes
- Shows loading spinner while fetching
- Empty focused state: shows recent searches from `useSearchHistory`
- Closes on outside click and on scroll in the main container
- On suggestion click: `router.push(suggestion.slug)` to detail page
- On submit: calls `onNavigate()` which navigates to `/search?q=...`

---

## Phase 7 — Search Page

**New file:** `src/app/(main)/search/page.tsx`
- Wraps `SearchContent` in `Suspense`

**New file:** `src/app/(main)/search/search-content.tsx`
- `"use client"`
- Uses extended `useFilterParams` (adds `type`, `yearMin`, `yearMax`, `languages`)
- Renders: `SearchAutocomplete`, type tabs, sort dropdown, `FacetPanel`, `UnifiedSearchResults`
- Auto-focuses input on mount

**New file:** `src/app/(main)/search/search-results.tsx`
- Renders mixed results from `useUnifiedSearch`
- Each result: `type === "movie"` → `<MovieCard>`, `type === "series"` → `<SeriesCard>`
- Badge overlay on each card: "Movie" or "Series"
- Infinite scroll via `onLoadMore`

**New file:** `src/app/(main)/search/facet-panel.tsx`
- Desktop: left sidebar with collapsible sections
- Mobile: bottom sheet / drawer
- Sections: Tags (checkboxes, AND logic), Year range (min/max inputs), Language (checkboxes from fetched unique values), Type tabs
- Active filters shown as removable chips above results

---

## Phase 8 — Bottom Nav Update

**File:** `src/components/app-layout.tsx`

Replace nav item:
```ts
// Before
{ key: "explore", label: "Explore", icon: Compass, href: "/explore" }
// After
{ key: "search", label: "Search", icon: Search, href: "/search" }
```

Search nav item behavior: tapping navigates to `/search`, input auto-focuses on mount.

---

## Phase 9 — URL Params Hook Extension

**File:** `src/hooks/use-filter-params.ts`

Extend `FilterParams` interface:
```ts
interface FilterParams {
  q: string; type: "all" | "movie" | "series";
  tags: number[]; yearMin?: number; yearMax?: number;
  languages: string[]; sortBy: string; sortDir: "asc" | "desc";
}
```

Update `readParams()` and `setParams()` to sync all new fields.

---

## Phase 10 — Cache Invalidation

**File:** `src/lib/cache.ts`

Add invalidation scope:
```ts
"search": ["search:*"],
```

Invalidate `search` scope on movie/series create/update/delete (add to existing mutation handlers in API routes and `optimisticUpdate` flows).

---

## Phase 11 — Redirects (deferred)

After nav points to `/search`, add redirects:
- `/explore?q=foo` → `/search?q=foo` (preserve params)
- `/series/explore?q=foo` → `/search?q=foo&type=series`

Implementation: Next.js middleware or route segment config. Keep old pages functional during transition.

---

## Files Changed Summary

| Action | File | Phase |
|--------|------|-------|
| Edit | `src/db/schema.ts` | 1 |
| New | `src/services/search.ts` | 2 |
| Edit | `src/services/movies.ts` | 2 |
| Edit | `src/services/series.ts` | 2 |
| New | `src/app/api/search/route.ts` | 3 |
| New | `src/app/api/search/suggestions/route.ts` | 3 |
| New | `src/lib/api/search.ts` | 4 |
| New | `src/hooks/use-unified-search.ts` | 5 |
| New | `src/hooks/use-search-suggestions.ts` | 5 |
| New | `src/hooks/use-search-history.ts` | 5 |
| New | `src/components/search-autocomplete.tsx` | 6 |
| New | `src/app/(main)/search/page.tsx` | 7 |
| New | `src/app/(main)/search/search-content.tsx` | 7 |
| New | `src/app/(main)/search/search-results.tsx` | 7 |
| New | `src/app/(main)/search/facet-panel.tsx` | 7 |
| Edit | `src/components/app-layout.tsx` | 8 |
| Edit | `src/hooks/use-filter-params.ts` | 9 |
| Edit | `src/lib/cache.ts` | 10 |
| New | `src/app/explore/[[...slug]]/route.ts` | 11 (deferred) |
| Edit | `src/app/(main)/series/explore/page.tsx` redirect | 11 (deferred) |

---

## Validation Checklist

- [ ] `npm run db:generate` produces migration with `search_vector` columns + GIN indexes
- [ ] `npm run db:migrate` applies cleanly
- [ ] `npm run lint` passes on all new files
- [ ] `GET /api/search?q=test&type=all` returns mixed results with correct `type` field
- [ ] `GET /api/search/suggestions?q=te&limit=6` returns ≤6 results in <200ms
- [ ] Autocomplete dropdown opens on input focus, closes on outside tap/scroll
- [ ] Keyboard nav: ↑↓ highlights, Enter selects, Escape closes
- [ ] Suggestion click navigates to movie/series detail page
- [ ] Type tabs filter results (All/Movies/Series counts correct)
- [ ] Tag filters apply AND logic across unified results
- [ ] Year range filter works for both movies and series
- [ ] Language filter works
- [ ] Sort by relevance uses FTS rank; sort by year/title works
- [ ] Bottom nav "Search" navigates to `/search` and auto-focuses input
- [ ] Search history persists in `localStorage` across sessions
- [ ] Infinite scroll loads next page correctly
- [ ] Redis cache hits on repeated queries

---

## Out of Scope

- Episode-level search (searching within a series episodes)
- Rating/vote_average facet (no schema column)
- Search analytics dashboard
- Dynamic facet counts (counts per facet option)
- Multi-language FTS dictionaries (hardcoded `'english'`)
