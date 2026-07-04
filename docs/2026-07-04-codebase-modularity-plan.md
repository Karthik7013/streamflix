# Codebase Modularity & Maintainability Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate duplicated types, decompose god components/hooks, consolidate overlapping utilities, and clean up layer violations across the codebase.

**Architecture:** The codebase has grown organically — types are scattered, services accumulate unrelated logic, and components mix too many concerns. Fixes are targeted per file with no global restructuring. Each task is independently verifiable.

**Tech Stack:** Next.js 16, React 19, TanStack Query, Drizzle ORM, Better Auth

---

## Current Issues Summary

| Category | Severity | Count |
|---|---|---|
| Duplicated types/interfaces (Tag, Episode, Movie, etc.) | High | ~17 types repeated across 40+ files |
| God components/hooks (>200 lines, >5 useState) | High | 8 components, 4 hooks |
| Components with >10 props (ISP violation) | High | 4 components |
| God services (movies.ts 440 lines, series.ts 362 lines) | High | 2 files |
| Code duplication (formatDuration, pickDefined unused, fmt overlap) | Medium | 5 instances |
| Layer mixing (client hooks in server lib/, cross-service imports) | Medium | 3 instances |
| Over-engineered wrappers (logger, upload barrel) | Low | 2 files |

---

## Task 1: Consolidate Duplicated Types

**Problem:** The same entity types (Tag, Episode, Movie, User, PaginatedResponse) are redefined in 3-7 files each with slightly different shapes. When the DB schema changes, every file needs manual updates.

**Solution:** Create a single `src/types.ts` module that exports all shared entity types, removing local interface definitions from components and pages.

### Step 1.1: Create `src/types.ts` with all shared types

Create a file that defines all shared entity interfaces:

```typescript
export interface Tag {
  id: number;
  name: string;
  createdAt?: string;
}

export interface Episode {
  id: number;
  seasonId: number;
  episodeNumber: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  createdAt: string;
}

export interface Season {
  id: number;
  seriesId: number;
  seasonNumber: number;
  title: string;
  episodes?: Episode[];
}

export interface Movie {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  durationSeconds: number | null;
  releaseDate: string | null;
  tmdbId: number | null;
  originalLanguage: string | null;
  tags?: Tag[];
  createdAt?: string;
}

export interface Series {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  trailerUrl: string | null;
  releaseDate: string | null;
  tmdbId: number | null;
  tags?: Tag[];
  seasons?: Season[];
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  banned: boolean | null;
  banReason: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovieCardData {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  progressSeconds?: number;
  durationSeconds?: number;
}

export interface FeaturedItem {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  backdropUrl: string | null;
  tags: Tag[];
}

export interface Comment {
  id: number;
  movieId: number;
  userId: string;
  content: string;
  createdAt: string;
  user: { name: string; image: string | null };
}

export interface MovieRequest {
  id: number;
  userId: string;
  title: string;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
}

export interface Report {
  id: number;
  movieId: number;
  userId: string;
  reason: string;
  status: string;
  createdAt: string;
  user: { name: string };
  movie: { title: string; slug: string };
}

export interface Signup {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
```

**Files:**
- Create: `src/types.ts`

### Step 1.2: Replace `interface Tag` definitions with import

Replace `interface Tag` in these files with `import { Tag } from "@/types"`:

**Files to modify:**
- `src/components/entity-dialog.tsx:34` — remove `interface Tag { id: number; name: string }`
- `src/app/admin/movies-table.tsx:13` — remove local Tag interface
- `src/app/admin/series-table.tsx:13` — remove local Tag interface
- `src/app/admin/tags-table.tsx:19` — remove local Tag interface (replace with `import { Tag } from "@/types"`)
- `src/app/admin/tags/page.tsx:29` — remove local Tag interface
- `src/app/(main)/explore/tag-filter.tsx:5` — remove local Tag interface
- `src/app/(main)/series/series-content.tsx:17` — remove local Tag interface

### Step 1.3: Replace `interface Episode` definitions with import

Replace in:
- `src/app/(main)/watch/series/[slug]/page.tsx:11` — remove local Episode interface
- `src/app/(main)/series/[slug]/series-detail-client.tsx:15` — remove local Episode interface
- `src/components/episode-dialog.tsx:18` — remove local Episode interface, add `import type { Episode } from "@/types"; use Partial<Episode>`

### Step 1.4: Replace `interface Season` definitions with import

Replace in:
- `src/app/(main)/watch/series/[slug]/page.tsx:24` — remove local Season interface
- `src/app/(main)/series/[slug]/series-detail-client.tsx:27` — remove local Season interface

### Step 1.5: Replace `interface Movie` definitions with import (use Pick<> for subsets)

Replace in:
- `src/app/(main)/explore/movie-grid.tsx:8` — replace with `import type { Movie } from "@/types"`
- `src/app/admin/movies/page.tsx:34` — replace with import
- `src/app/admin/movies-table.tsx:18` — replace with import

### Step 1.6: Replace `interface PaginatedResponse` and `User` definitions

Replace in:
- `src/app/admin/tags/page.tsx:36`
- `src/app/admin/reports/page.tsx:40`
- `src/app/admin/requests/page.tsx:49`
- `src/app/admin/users-table.tsx:20`
- `src/app/admin/users/page.tsx:25`

### Step 1.7: Replace remaining duplicated interfaces

Replace in:
- `src/app/admin/requests-table.tsx:10,15` — RequestUser + MovieRequest → import from types
- `src/app/admin/page.tsx:12,20` — Signup + FavoritedMovie → import from types
- `src/app/admin/most-favorited.tsx:6` — FavoriteMovie → import from types
- `src/app/(main)/favorites/favorites-content.tsx:18` — FavoriteMovie → import from types
- `src/app/admin/recent-signups.tsx:5` — Signup → import from types
- `src/app/admin/series-table.tsx:18` — SerializedSeries → import
- `src/app/admin/series/page.tsx:33` — SerializedSeries → import
- `src/app/(main)/home/types.ts:1` — HomeMovie → import MovieCardData from types

---

## Task 2: Decompose God Component — `login/page.tsx`

**Problem:** 380 lines mixing auth state, OAuth handlers, form logic, and all JSX inline. Hard to read or extend.

**Solution:** Extract OAuth buttons and email form into separate components.

### Step 2.1: Create `src/app/login/oauth-buttons.tsx`

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OAuthButtonsProps {
  onSignIn: (provider: "google" | "github") => Promise<void>;
}

export function OAuthButtons({ onSignIn }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<"google" | "github" | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        disabled={loading !== null}
        onClick={async () => {
          setLoading("google");
          await onSignIn("google");
          setLoading(null);
        }}
      >
        {loading === "google" ? "Loading..." : "Continue with Google"}
      </Button>
      <Button
        variant="outline"
        disabled={loading !== null}
        onClick={async () => {
          setLoading("github");
          await onSignIn("github");
          setLoading(null);
        }}
      >
        {loading === "github" ? "Loading..." : "Continue with GitHub"}
      </Button>
    </div>
  );
}
```

### Step 2.2: Create `src/app/login/email-form.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EmailFormProps {
  mode: "signIn" | "signUp";
  onSubmit: (email: string, password: string) => Promise<string | null>;
}

export function EmailForm({ mode, onSubmit }: EmailFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const err = await onSubmit(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Loading..." : mode === "signIn" ? "Sign In" : "Sign Up"}
      </Button>
    </form>
  );
}
```

### Step 2.3: Refactor `src/app/login/page.tsx`

- Remove inline OAuth button JSX → use `<OAuthButtons onSignIn={...} />`
- Remove inline email form JSX → use `<EmailForm mode={mode} onSubmit={...} />`
- Keep auth mode toggle, session redirect, and layout JSX in the page

---

## Task 3: Decompose God Component — `explore-content.tsx`

**Problem:** 237 lines with 4 useEffect + 3 useRef for URL sync, scroll restoration, infinite scroll — too many unrelated concerns.

**Solution:** Extract URL sync and scroll restoration into custom hooks.

### Step 3.1: Create `src/hooks/use-url-params.ts`

```typescript
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

export function useUrlParams<T extends Record<string, string | undefined>>() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const getParams = useCallback((): T => {
    return Object.fromEntries(searchParams.entries()) as T;
  }, [searchParams]);

  const setParams = useCallback(
    (params: Partial<T>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { getParams, setParams };
}
```

### Step 3.2: Refactor `explore-content.tsx`

- Remove 2 of the 4 useEffect (URL sync ones) → use `useUrlParams` instead
- Move scroll restoration logic into the component, simplified
- Remove useRef for sentinel → keep IntersectionObserver logic but in a single effect

---

## Task 4: Decompose God Component — `admin/tags/page.tsx`

**Problem:** 259 lines with 8 useState for inline CRUD. Inline create/edit/delete flows mixed with list rendering.

**Solution:** Extract CRUD inline forms into sub-components.

### Step 4.1: Create `src/app/admin/tags/tag-row.tsx`

Extract the inline editing row into its own component (the `editingId` / `editingName` state logic is deeply coupled to the list right now). The tag row shows either the tag name with action buttons or an inline edit input.

### Step 4.2: Create `src/app/admin/tags/create-tag-form.tsx`

Extract the "add new tag" inline form (controlled by `creating` + `newTagName` state) into its own component with local state.

### Step 4.3: Refactor `src/app/admin/tags/page.tsx`

- Remove `creating`, `newTagName`, `editingId`, `editingName`, `deleteTarget` state → each sub-component manages its own state
- Remove inline create/edit JSX → use `<CreateTagForm />` and `<TagRow />`

---

## Task 5: Fix `episode-dialog.tsx` — 10 useState for Form Fields

**Problem:** 10 separate useState calls for individual form fields. Every field gets its own setter, validation, and reset logic.

**Solution:** Consolidate into a single `useReducer` or `react-hook-form` (already used in `entity-dialog.tsx`).

Since the project already uses `react-hook-form` (imported in `entity-dialog.tsx`), migrate `episode-dialog.tsx` to use it too.

### Step 5.1: Rewrite `episode-dialog.tsx`

Replace 10 `useState` with `useForm`:

```typescript
const form = useForm({
  defaultValues: {
    title: "",
    slug: "",
    episodeNumber: 0,
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    backdropUrl: "",
    durationSeconds: "",
    releaseDate: "",
  },
});
```

Each field uses `{...register("fieldName")}` instead of individual value/onChange handlers. Remove all 10 useState declarations.

---

## Task 6: Decompose `entity-dialog.tsx` — Reduce 14 Props

**Problem:** 14 props on an already complex dialog component.

**Solution:** Split into focused sub-components and lean on the `children` slot more.

### Step 6.1: Extract form section into `src/components/entity-form-fields.tsx`

The massive inline form JSX (title, description, tags, TMDB search, upload fields) gets extracted into a component that receives `form`, `entityName`, and `tmdbMediaType`. This removes ~100 lines from `entity-dialog.tsx`.

### Step 6.2: Add `FormSection` grouping to props

Current props (14): `open, onOpenChange, initialData, editId, onSuccess, schema, defaultValues, apiEndpoint, entityName, assetFolder, tmdbMediaType, children, onBeforeSubmit`

Group into:
```typescript
interface EntityDialogProps {
  dialog: { open: boolean; onOpenChange: (v: boolean) => void };
  entity: { initialData?: any; editId?: number; entityName: string; assetFolder: string };
  api: { endpoint: string; schema: any; defaultValues: any };
  callbacks: { onSuccess: () => void; onBeforeSubmit?: (data: any) => any };
  tmdbMediaType?: "movie" | "tv";
  children?: React.ReactNode;
}
```

---

## Task 7: Clean Up God Services — `services/movies.ts` and `services/series.ts`

**Problem:** `movies.ts` (440 lines) and `series.ts` (362 lines) handle CRUD, search, caching, admin listing, file deletion — too many concerns.

### Step 7.1: Fix `services/series.ts` cross-import from `services/movies.ts`

Move `DEFAULT_PAGE_SIZE` to a shared constant:

**Create** `src/lib/constants.ts`:
```typescript
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
```

**Modify** `services/movies.ts` and `services/series.ts` — import `DEFAULT_PAGE_SIZE` from `@/lib/constants` instead of cross-importing.

### Step 7.2: Fix `services/series.ts` re-exports of seasons/episodes

In `services/series.ts`, remove these re-exports:
```typescript
// Remove these lines:
export type { SeasonRow } from "./seasons";
export type { EpisodeRow } from "./episodes";
export { getSeasonsBySeriesId, createSeason, updateSeason, deleteSeason } from "./seasons";
export { getEpisodesBySeasonId, createEpisode, updateEpisode, deleteEpisode } from "./episodes";
```

**Update all importers** that imported seasons/episodes through `services/series` to import directly from `services/seasons` or `services/episodes`:
- Search: `from "@/services/series"` that use `getSeasonsBySeriesId` or `getEpisodesBySeasonId`
- Update to: `from "@/services/seasons"` or `from "@/services/episodes"`

### Step 7.3: Use `pickDefined` consistently in update functions

**Modify** these files to use `pickDefined` instead of manual `if (data.x !== undefined)` blocks:

- `services/series.ts` `updateSeries` (lines 102-111) — replace ~9 if-checks
- `services/episodes.ts` `updateEpisode` (lines 80-88) — replace ~9 if-checks
- `services/seasons.ts` `updateSeason` (lines 79-83) — replace ~5 if-checks

Example change:
```typescript
// Before:
if (data.title !== undefined) updateData.title = data.title;
if (data.description !== undefined) updateData.description = data.description;
// ...repeat for 9 fields

// After:
const { id, ...fields } = data;
Object.assign(updateData, pickDefined(fields));
```

---

## Task 8: Fix Duplicated Formatters

**Problem:** `formatDuration` re-implemented inline in `watch-content.tsx`, `formatMinutes` used inline in `watch/series/[slug]/page.tsx`, `fmt` and `formatDuration` overlap.

### Step 8.1: Replace inline `formatDuration` in `watch-content.tsx`

Remove the local `formatDuration` function (lines 162-166), import from `@/lib/format` instead.

### Step 8.2: Replace inline `formatMinutes` and `formatYear` in watch series page

In `src/app/(main)/watch/series/[slug]/page.tsx`, replace:
- `Math.floor(currentEpisode.durationSeconds / 60).toString()` → `formatMinutes(currentEpisode.durationSeconds)?.toString() ?? ""`
- `new Date(series.releaseDate).getFullYear().toString()` → `formatYear(series.releaseDate) ?? ""`

Import from `@/lib/format`:
```typescript
import { formatMinutes, formatYear } from "@/lib/format";
```

### Step 8.3: Merge overlapping formatters

In `src/lib/player-utils.ts`, the `fmt` function formats seconds to `h:mm:ss` or `m:ss`. In `src/lib/format.ts`, `formatDuration` formats to `1h 30m`. These serve different use cases. Keep both but rename `fmt` to `formatTimecode` for clarity:

- Rename `fmt` → `formatTimecode` in `player-utils.ts` and update callers in `player-controls.tsx`
- Or keep as-is since the naming difference (`fmt` vs `formatDuration`) already signals different concerns

---

## Task 9: Fix Layer Violations

**Problem:** Client hooks in `lib/` (risky server imports), barrel re-export wrappers, over-engineered logger.

### Step 9.1: Move `use-auth-logout.ts` from `lib/` to `hooks/`

```bash
git mv src/lib/use-auth-logout.ts src/hooks/use-auth-logout.ts
```
Update all importers (search for `@/lib/use-auth-logout`).

### Step 9.2: Remove `services/upload.ts` barrel

Replace all imports of `from "@/services/upload"` with direct imports from `@/lib/upload-utils`:
- Search imports of `@/services/upload`
- Update to `@/lib/upload-utils`
- Delete `src/services/upload.ts`

### Step 9.3: Simplify `lib/logger.ts`

Inline the single usage into the calling code. Currently used in:
- `services/movies.ts:395` — `logger.error(...)`

Replace `logger.error(...)` with `console.error(...)` directly in that file, then delete `lib/logger.ts`.

---

## Task 10: Clean Up Admin List Boilerplate (Low Priority)

**Problem:** 5 admin list functions (`listAdminTags`, `listAdminMovies`, `listAdminSeries`, `listAdminRequests`, `listAdminReports`) follow the exact same pattern with minor differences.

**Solution:** Extract a shared factory in `lib/admin-list.ts`.

### Step 10.1: Add `createListAdmin` factory to `lib/admin-list.ts`

```typescript
export function createListAdmin<T>(
  table: AnyPgTable,
  config: AdminListConfig,
) {
  return async (params: AdminListParams): Promise<PaginatedResponse<T>> => {
    const query = parseAdminListQuery(params, config);
    // ...build drizzle query...
    return { items: results as T[], total, page, limit, totalPages };
  };
}
```

### Step 10.2: Refactor the 5 admin list functions

Each becomes:
```typescript
export const listAdminTags = createListAdmin<Tag>(tagsTable, tagListConfig);
```

Requires making `AdminListConfig` generic enough to handle all 5 entity types.

---

## Execution Order

| Task | Priority | Effort | Dependencies |
|------|----------|--------|-------------|
| 1 (Types consolidation) | High | Medium | None |
| 7.1 (Constants extraction) | High | Small | None |
| 7.2 (Fix cross-imports) | High | Medium | Task 7.1 |
| 7.3 (pickDefined usage) | High | Small | None |
| 8 (Duplicate formatters) | High | Small | None |
| 9 (Layer violations) | High | Small | None |
| 5 (episode-dialog form) | High | Medium | None |
| 2 (login page split) | Medium | Medium | None |
| 4 (tags page split) | Medium | Medium | None |
| 3 (explore content refactor) | Medium | Medium | None |
| 6 (entity-dialog props) | Low | Medium | Task 1 |
| 10 (Admin list factory) | Low | Large | Task 1 |
