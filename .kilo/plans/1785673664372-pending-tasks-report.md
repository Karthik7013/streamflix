# Pending Tasks — StreamFlix Session Branch

## Branch State

The current session branch (`session/agent_70cfe377-...`) is **9 commits behind `master`**:

| Master commit | Description |
|---------------|-------------|
| `8f55790` | refactor: enhance query invalidation logic across admin pages and hooks |
| `06b3cbd` | feat: enhance reports management with pending action indicators and improved UI feedback |
| `5b9208a` | feat: add WatchlistLink component and enhance WatchlistRow with empty state UI |
| `fb0f383` | feat: refactor watchlist functionality with new add/remove mutations and update related components |
| `a414cae` | feat: add siteUrl function to determine the base URL for the application |
| `3667572` | refactor: remove dead player code, fix cache headers/sitemap, and decouple services |
| `95cd2cc` | feat: add Go back button to player error overlay and deterministic back navigation |
| `3b348e2` | feat: add full Open Graph metadata for movie and series detail pages |
| `534c53e` | feat: add Media Session API support for OS media notifications |

**Action required:** Merge or rebase `master` into this session branch before implementing the plans below to avoid conflicts.

---

## Plan Inventory

Three implementation plans exist but have **not been executed**:

| Plan | File | Status |
|------|------|--------|
| Netflix-Style Unified Search | `.kilo/plans/1785673664372-netflix-search-plan.md` | 0% — no files created yet |
| Admin Panel: Trending & Activity Log | `.kilo/plans/1785175002092-admin-features-plan.md` | 0% — no files created yet |
| Codebase Modularity & Maintainability | `docs/2026-07-04-codebase-modularity-plan.md` | ~60% — significant refactoring already done in session branch |

---

## Modularity Plan — Remaining Tasks

The session branch has already completed most modularity tasks via its 20+ refactor commits. What remains:

| Task | Description | Status |
|------|-------------|--------|
| 1.1 | Create `src/types.ts` with all shared entity types | **Pending** — `src/types/index.ts` exists (189 lines) but local interfaces may still exist in some files |
| 6 | Decompose `entity-dialog.tsx` — reduce 14 props | **Pending** — file is 306 lines with grouped props already partially done |
| 9.3 | Simplify `lib/logger.ts` | **Pending** — `src/lib/logger.ts` still exists |
| 10 | Admin list factory (`createListAdmin`) | **Pending** — no factory extracted yet |

**Already completed in session branch:**
- Tag, Episode, Season interface consolidation (no local definitions remain)
- `episode-dialog.tsx` migrated to `react-hook-form` (170 lines)
- `use-auth-logout` moved to `hooks/`
- `services/upload.ts` barrel removed
- `login/page.tsx` reduced to 298 lines
- `explore-content.tsx` reduced to 68 lines
- `tags/page.tsx` reduced to 94 lines
- `services/movies.ts` reduced to 206 lines
- `services/series.ts` reduced to 227 lines
- Cross-imports between series/movies services fixed

---

## Netflix Search Plan — All 11 Phases Pending

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Schema migration — `search_vector` tsvector columns + GIN indexes on `movies` and `series` | **Pending** |
| 2 | Unified search service (`src/services/search.ts`) + refactor existing movie/series search | **Pending** |
| 3 | API routes — `GET /api/search` and `GET /api/search/suggestions` | **Pending** |
| 4 | API client (`src/lib/api/search.ts`) | **Pending** |
| 5 | React Query hooks — `use-unified-search.ts`, `use-search-suggestions.ts`, `use-search-history.ts` | **Pending** |
| 6 | Autocomplete component (`src/components/search-autocomplete.tsx`) | **Pending** |
| 7 | Search page — `page.tsx`, `search-content.tsx`, `search-results.tsx`, `facet-panel.tsx` | **Pending** |
| 8 | Bottom nav update — replace "Explore" with "Search" | **Pending** |
| 9 | URL params hook extension (`use-filter-params.ts`) | **Pending** |
| 10 | Cache invalidation scope for `search:*` | **Pending** |
| 11 | Redirects from `/explore` and `/series/explore` to `/search` | **Deferred** (plan says deferred) |

---

## Admin Features Plan — All Pending

### Feature 1: Trending Management

| Task | Description | Status |
|------|-------------|--------|
| DB | Add `trending` table to `src/db/schema.ts` | **Pending** |
| Service | Create `src/services/trending.ts` | **Pending** |
| API | `GET/POST /api/admin/trending` and `PATCH/DELETE /api/admin/trending/[id]` | **Pending** |
| Admin UI | `src/app/admin/trending/page.tsx` | **Pending** |
| Sidebar | Add "Trending" nav item to `admin-layout.tsx` | **Pending** |
| API Client | Add `trending` to `adminApi` | **Pending** |
| Public API | `GET /api/home/trending` (optional) | **Pending** |

### Feature 2: Activity Log / Audit

| Task | Description | Status |
|------|-------------|--------|
| DB | Add `activity_logs` table to `src/db/schema.ts` | **Pending** |
| Service | Create `src/services/activity-logs.ts` + `src/lib/audit.ts` helper | **Pending** |
| Hooks | Add logging to existing admin CRUD services (movies, series, reports, requests, featured) | **Pending** |
| API | `GET /api/admin/activity-logs` | **Pending** |
| Admin UI | `src/app/admin/activity-logs/page.tsx` | **Pending** |
| Sidebar | Add "Activity Log" nav item to `admin-layout.tsx` | **Pending** |
| API Client | Add `activityLogs` to `adminApi` | **Pending** |

### Open Questions (unresolved in plan)

1. Trending reordering: drag-and-drop vs numeric `displayOrder` field?
2. Activity log access: expose to non-admin users?
3. Activity log retention: auto-purge after N days?
4. Public trending endpoint: create now or defer?

---

## Execution Order Recommendation

1. **Sync branch** — Merge `master` into session branch first
2. **Modularity remaining** (~1–2 days) — Small cleanup tasks that reduce friction for later work
3. **Admin Features** (~3–4 days) — DB schema → services → API → admin UI; Trending first, then Activity Log
4. **Netflix Search** (~5–7 days) — Schema → service → API → hooks → components → page → nav

Admin features and Netflix search are independent and can be parallelized across different implementation agents.

---

## Files Changed Summary

### Branch Sync
- Merge `master` into session branch (9 commits)

### Modularity (remaining)
| File | Change |
|------|--------|
| `src/types/index.ts` | Verify all shared types are centralized; remove any remaining local interfaces |
| `src/components/entity-dialog.tsx` | Reduce 14 props to grouped props object |
| `src/lib/logger.ts` | Remove or inline into callers |
| `src/lib/admin-list.ts` | Add `createListAdmin` factory |
| 5 admin list functions | Refactor to use factory |

### Netflix Search
| Action | File |
|--------|------|
| Edit | `src/db/schema.ts` |
| New | `src/services/search.ts` |
| Edit | `src/services/movies.ts`, `src/services/series.ts` |
| New | `src/app/api/search/route.ts`, `src/app/api/search/suggestions/route.ts` |
| New | `src/lib/api/search.ts` |
| New | `src/hooks/use-unified-search.ts`, `use-search-suggestions.ts`, `use-search-history.ts` |
| New | `src/components/search-autocomplete.tsx` |
| New | `src/app/(main)/search/page.tsx`, `search-content.tsx`, `search-results.tsx`, `facet-panel.tsx` |
| Edit | `src/components/app-layout.tsx` |
| Edit | `src/hooks/use-filter-params.ts` |
| Edit | `src/lib/cache.ts` |

### Admin Features
| Action | File |
|--------|------|
| Edit | `src/db/schema.ts` |
| New | `src/services/trending.ts`, `src/services/activity-logs.ts`, `src/lib/audit.ts` |
| New | `src/app/api/admin/trending/route.ts`, `src/app/api/admin/trending/[id]/route.ts` |
| New | `src/app/api/admin/activity-logs/route.ts`, `src/app/api/admin/activity-logs/[id]/route.ts` |
| New | `src/app/admin/trending/page.tsx` |
| New | `src/app/admin/activity-logs/page.tsx` |
| Edit | `src/components/admin-layout.tsx` |
| Edit | `src/lib/api/admin.ts` |
