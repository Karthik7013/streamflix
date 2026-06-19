# Performance & Consistency Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unnecessary re-renders, fix code consistency issues, and apply Vercel React best practices across StreamFlix.

**Architecture:** Targeted fixes per component — no global restructuring. Fixes ordered by performance impact (Critical → High → Medium → Low). Each task independently verifiable by inspecting the component's render behavior.

**Tech Stack:** Next.js 16, React 19, TanStack Query, Tailwind v4

---

### Task 1: Fix `hero-carousel.tsx` — 30ms progress bar re-render storm

**Files:**
- Modify: `src/components/hero-carousel.tsx`

**Problem:** `setProgress` fires every 30ms via `setInterval`, causing 33 full React re-renders per second. The progress bar is visual-only — it doesn't need React state.

- [ ] **Step 1: Replace state-driven progress with CSS animation**

Remove the `progress` state and its `setInterval`. The progress bar buttons at lines 204-209 currently use inline `style={{ width: ... }}` driven by `progress` state.

Replace the progress bar implementation with a pure CSS animation. Each progress bar button gets a `<div>` that animates via CSS `@keyframes` and `animation-duration: 6s`:

```tsx
// Inline style-based progress removed. Use CSS animation instead.
// Inside the progress bar button divs (lines 195-215), replace:
//   style={{ width: i === current ? `${progress * 100}%` : ... }}
// With:
//   className={`absolute inset-0 bg-white rounded-full ${i === current ? 'animate-progress' : ''}`}
//   style={i === current ? { animationDuration: '6s' } : undefined}
```

Add a CSS keyframe in `globals.css`:

```css
@keyframes progress-fill {
  from { width: 0%; }
  to { width: 100%; }
}
.animate-progress {
  animation: progress-fill 6s linear forwards;
}
```

- [ ] **Step 2: Remove the `progress` state and `startProgress` function**

Delete lines 26, 28-29, 36-45, and the `progressRef`. Remove `setProgress` from imports. The `startProgress` call in `goTo` and the `useEffect` should be removed.

- [ ] **Step 3: Simplify `goTo` to use a ref for current**

Change `goTo` to not depend on `current` state for the early return check. Use a ref for debounced skip logic:

```tsx
const skippingRef = useRef(false);

const goTo = useCallback((i: number) => {
  if (skippingRef.current) return;
  skippingRef.current = true;
  clearTimers();
  setCurrent(i);
  timerRef.current = setInterval(() => {
    setCurrent((c) => (c + 1) % length);
  }, 6000);
  // Reset skip guard on next tick
  requestAnimationFrame(() => { skippingRef.current = false; });
}, [length, clearTimers]);
```

- [ ] **Step 4: Clean up the `useEffect`**

Remove `startProgress` from the effect deps. The effect should only set up the auto-advance timer:

```tsx
useEffect(() => {
  if (length <= 1) return;
  timerRef.current = setInterval(() => {
    setCurrent((c) => (c + 1) % length);
  }, 6000);
  return clearTimers;
}, [length, clearTimers]);
```

- [ ] **Step 5: Remove unused imports**

Remove `useRef` if no longer needed after simplification. Also remove setProgress, progress from the useState imports.

---

### Task 2: Fix `watch-content.tsx` — onMouseMove re-render storm

**Files:**
- Modify: `src/app/(main)/watch/[slug]/watch-content.tsx`

**Problem:** `onMouseMove` fires on every pixel move, calling `setUiVisible(true)` each time — causing React re-render at screen refresh rate.

- [ ] **Step 1: Replace `onMouseMove` direct setState with a debounced timer reset**

Change the mouse handler to use a ref-based timer approach. Only set state when visibility actually changes:

```tsx
// Remove the direct setUiVisible(true) from onMouseMove
// Instead, use a single effect-based approach:

const uiVisibleRef = useRef(true);

const showUiTemporarily = useCallback(() => {
  if (!uiVisibleRef.current) {
    uiVisibleRef.current = true;
    setUiVisible(true);
  }
  clearTimeout(hideTimer.current);
  hideTimer.current = setTimeout(() => {
    uiVisibleRef.current = false;
    setUiVisible(false);
  }, 3000);
}, []);
```

- [ ] **Step 2: Apply the debounced handler to the container div**

Replace the inline `onMouseMove` with the debounced version:

```tsx
// Line 174: change from:
//   onMouseMove={() => setUiVisible(true)}
// to:
//   onMouseMove={showUiTemporarily}
```

- [ ] **Step 3: Initial auto-hide in useEffect**

Simplify the mount effect:

```tsx
useEffect(() => {
  showUiTemporarily();
  return () => clearTimeout(hideTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

Remove the `setUiVisible` dependency from the existing effect.

---

### Task 3: Fix array index as React keys in `explore-content.tsx`

**Files:**
- Modify: `src/app/(main)/explore/explore-content.tsx`

**Problem:** Two instances of array index as key cause full remount on list changes.

- [ ] **Step 1: Fix tag button key**

Line 138-140: Change from:
```tsx
{tags.map((tag: any, _: number) => (
  <button key={_} ...
```

To:
```tsx
{tags.map((tag: { id: number; name: string }) => (
  <button key={tag.id} ...
```

- [ ] **Step 2: Fix movie card key**

Line 176-178: Change from:
```tsx
{movies.map((m, _) => (
  <MovieCard key={_} {...m} />
))}
```

To:
```tsx
{movies.map((m: { id: number }) => (
  <MovieCard key={m.id} {...m} />
))}
```

- [ ] **Step 3: Add `useCallback` to `toggleTag`**

Wrap `toggleTag` in `useCallback`:

```tsx
const toggleTag = useCallback((tagId: number) => {
  setSelectedTags((prev) =>
    prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
  );
}, []);
```

---

### Task 4: Extract shared utilities and fix dead code

**Files:**
- Create: `src/lib/format.ts`
- Delete (dead code): `src/lib/api.ts`
- Modify: `src/components/hero-carousel.tsx`
- Modify: `src/app/(main)/watch/[slug]/watch-content.tsx`
- Modify: `src/app/admin/movies/page.tsx`

**Problem:** `formatDuration` duplicated in 3 files. `new Date().getFullYear()` in 3 places. `apiFetch` is dead code.

- [ ] **Step 1: Create `src/lib/format.ts`**

```typescript
export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatYear(date: string | null | undefined): string | null {
  if (!date) return null;
  return new Date(date).getFullYear().toString();
}

export function formatMinutes(seconds: number | null | undefined): number | null {
  if (!seconds) return null;
  return Math.round(seconds / 60);
}
```

- [ ] **Step 2: Update `hero-carousel.tsx`**

Replace inline `formatDuration` and `getYear` with imports from `@/lib/format`.

Remove lines 70-81 (both function declarations). Import at top:
```typescript
import { formatDuration, formatYear } from "@/lib/format";
```

Replace `getYear(item.releaseDate)` with `formatYear(item.releaseDate)`.
Replace `formatDuration(item.durationSeconds)` with `formatDuration(item.durationSeconds)`.

- [ ] **Step 3: Update `watch-content.tsx`**

Remove lines 10-15 (the `formatDuration` function). Import:
```typescript
import { formatDuration } from "@/lib/format";
```
Replace inline `new Date(movie.releaseDate).getFullYear()` with `formatYear(movie.releaseDate)`.

- [ ] **Step 4: Update `admin/movies/page.tsx`**

Remove lines 439-444 (the `formatDuration` function). Import:
```typescript
import { formatDuration } from "@/lib/format";
```

- [ ] **Step 5: Update `movie-detail-content.tsx`**

Replace inline `Math.round(movie.durationSeconds / 60)` and `new Date(movie.releaseDate).getFullYear()`:
```typescript
import { formatMinutes, formatYear } from "@/lib/format";
```

Replace line 80-82 with `const durationMin = formatMinutes(movie.durationSeconds);`
Replace line 84-86 with `const releaseYear = formatYear(movie.releaseDate);`

- [ ] **Step 6: Remove dead code — delete `/src/lib/api.ts`**

The file defines `apiFetch` which is never imported anywhere in the project.

```bash
rm src/lib/api.ts
```

---

### Task 5: Fix `home/page.tsx` typo and clean up

**Files:**
- Modify: `src/app/(main)/home/page.tsx`

**Problem:** Typo `overflow-y-autospace-y-8` is a concatenated class that does nothing.

- [ ] **Step 1: Fix the class name**

Line 6:
```tsx
// From:
<div className="flex-1 overflow-y-autospace-y-8">
// To:
<div className="flex-1 overflow-y-auto space-y-8">
```

---

### Task 6: Fix `"use client"` consistency

**Files:**
- Modify: `src/app/admin/movies/page.tsx`
- Modify: `src/app/(main)/requests/request-form.tsx`
- Modify: `src/components/movie-dialog.tsx`
- Modify: `src/components/internet-archive-player.tsx`
- Modify: `src/hooks/use-mobile.ts`

**Problem:** Inconsistent `"use client"` semicolon usage. `use-mobile.ts` missing the directive despite accessing `window`.

- [ ] **Step 1: Normalize all `"use client"` directives**

Change these files to use `"use client";` (with semicolon):
- `src/app/admin/movies/page.tsx:1`: `"use client"` → `"use client";`
- `src/app/(main)/requests/request-form.tsx:1`: `"use client"` → `"use client";`
- `src/components/movie-dialog.tsx:1`: add semicolon
- `src/components/internet-archive-player.tsx:1`: add semicolon

- [ ] **Step 2: Add `"use client"` to `use-mobile.ts`**

```typescript
"use client";

import * as React from "react"
// ... rest stays same
```

---

### Task 7: Convert admin movies page to use React Query

**Files:**
- Modify: `src/app/admin/movies/page.tsx`

**Problem:** Admin movies page uses raw `useState` + `useEffect` + `fetch` with manual race-condition guards. The rest of the app uses TanStack Query.

- [ ] **Step 1: Replace state+effect with useQuery**

Import needed hooks:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
```

Remove these state variables and the fetch effect (lines 165-210):
- `movies`, `total`, `page`, `totalPages`, `loading`, `version`, `pageCount`
- The entire main `useEffect` (lines 182-206)
- The search-reset `useEffect` (lines 208-210)

Add:
```typescript
const [page, setPage] = useState(1);
const [search, setSearch] = useState("");
const debouncedSearch = useDebounce(search, 300);

const { data, isLoading } = useQuery({
  queryKey: ["admin-movies", page, debouncedSearch],
  queryFn: async () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch(`/api/admin/movies?${params}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json() as Promise<PaginatedResponse>;
  },
});

const movies = data?.movies ?? [];
const total = data?.total ?? 0;
const totalPages = data?.totalPages ?? 0;
```

- [ ] **Step 2: Replace delete logic with useMutation**

```typescript
const queryClient = useQueryClient();

const deleteMutation = useMutation({
  mutationFn: async (movieId: number) => {
    const res = await fetch(`/api/admin/movies/${movieId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
  },
  onSuccess: () => {
    toast.success("Movie deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-movies"] });
  },
  onError: () => toast.error("Failed to delete movie"),
});
```

Replace `handleDelete` to call `deleteMutation.mutate(deleteTarget.id)`.

---

### Task 8: Add shared `BackButton` component

**Files:**
- Create: `src/components/back-button.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = "Back", className = "" }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center gap-1 text-white/70 hover:text-white transition-colors ${className}`}
    >
      <ChevronLeft className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Update `watch-content.tsx`**

Replace inline back button (lines 115-122 in the `!movie.videoUrl` branch, and lines 190-197 in the main branch) with `<BackButton label={movie.title} />`.

- [ ] **Step 3: Update `movie-detail-content.tsx`**

Replace inline back button (lines 109-117) with `<BackButton />`.

---

### Task 9: Add `use-favorites` shared hook

**Files:**
- Create: `src/hooks/use-favorites.ts`

**Problem:** Favorites toggle mutation with optimistic update is duplicated in `movie-detail-content.tsx` and `favorites-content.tsx`.

- [ ] **Step 1: Create the shared hook**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movieId: number) => {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (movieId) => {
      await queryClient.cancelQueries({ queryKey: ["favorites"] });
      const prev = queryClient.getQueryData(["favorites"]);
      queryClient.setQueryData(["favorites"], (old: any) => ({
        ...old,
        movies: (old?.movies ?? []).filter((m: any) => m.id !== movieId),
      }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["favorites"], ctx.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
```

- [ ] **Step 2: Update `favorites-content.tsx`**

Replace inline `removeFavorite` mutation with the hook:
```typescript
import { useFavorites } from "@/hooks/use-favorites";
// ...
const removeFavorite = useFavorites();
```

Remove the full mutation block (lines 24-51).

- [ ] **Step 3: Update `movie-detail-content.tsx`**

The movie detail page's toggle is slightly different (it toggles `isFavorited` on the movie query). Keep that one in place — it's a different key (`["movie", slug]`), not `["favorites"]`.

---

### Task 10: Extract inline form handler in `settings-content.tsx`

**Files:**
- Modify: `src/app/(main)/settings/settings-content.tsx`

**Problem:** The password change form has a large inline `onSubmit` handler (lines 149-179) in JSX.

- [ ] **Step 1: Extract the submit handler**

Pull lines 149-179 into a named function before the return:

```tsx
async function handlePasswordChange(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setPasswordError("");
  setPasswordSuccess(false);
  const form = e.currentTarget;
  const formData = new FormData(form);
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  if (newPassword !== confirmPassword) {
    setPasswordError("Passwords do not match");
    return;
  }
  if (newPassword.length < 8) {
    setPasswordError("New password must be at least 8 characters");
    return;
  }
  setChangingPassword(true);
  const { error } = await authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  setChangingPassword(false);
  if (error) {
    setPasswordError(error.message || "Failed to change password");
  } else {
    setPasswordSuccess(true);
    form.reset();
  }
}
```

Replace `onSubmit={async (e) => { ... }}` with `onSubmit={handlePasswordChange}`.

---

### Task 11: Standardize `<img>` to `<Image>` in admin pages

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/movies/page.tsx`
- Modify: `src/app/admin/users/page.tsx`
- Modify: `src/app/admin/featured/page.tsx`

**Problem:** Admin pages use raw `<img>` tags — no optimization, no lazy loading, no width/height.

- [ ] **Step 1: Fix `admin/movies/page.tsx` `MovieRow` component**

Line 106-110: Replace `<img>` with `<Image>`:
```typescript
import Image from "next/image";
// ...
{movie.thumbnailUrl ? (
  <Image
    src={movie.thumbnailUrl}
    alt={movie.title}
    width={48}
    height={48}
    className="size-full object-cover transition-transform group-hover:scale-105"
  />
) : (
```

- [ ] **Step 2: Scan and fix remaining admin pages**

Apply the same pattern to `admin/page.tsx`, `admin/users/page.tsx`, and `admin/featured/page.tsx` — replace `<img>` with `<Image>` with explicit width/height.

---

### Task 12: Add `<link rel="preconnect">` for external CDNs

**Files:**
- Modify: `src/app/layout.tsx`

**Problem:** Images load from 4+ external CDNs with no preconnect hints, causing connection setup latency.

- [ ] **Step 1: Add preconnect links to root layout**

Insert before the `<body>` tag or in `<head>`:

```typescript
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://media-cache.cinematerial.com" />
        <link rel="preconnect" href="https://cdn.cinematerial.com" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://archive.org" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}<Toaster /></Providers>
      </body>
    </html>
  );
}
```

---

### Task 13: Fix remaining `any` types and add interfaces

**Files:**
- Modify: `src/app/(main)/home/home-content.tsx`
- Modify: `src/app/(main)/explore/explore-content.tsx`
- Modify: `src/app/(main)/favorites/favorites-content.tsx`

**Problem:** Widespread `any` types on API response data.

- [ ] **Step 1: Add interface for home API response**

In `home-content.tsx`, before the component:

```typescript
interface HomeMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  progressSeconds?: number;
  durationSeconds?: number;
}

interface HomeData {
  featured: any[];
  continueWatching: HomeMovie[];
  recentlyAdded: HomeMovie[];
}
```

Update the query cast: `return res.json() as Promise<HomeData>;`

Replace `(m: any)` with `(m: HomeMovie)`.

- [ ] **Step 2: Add interface for explore API response**

```typescript
interface Tag { id: number; name: string; }
interface ExploreMovie { id: number; title: string; slug: string; thumbnailUrl: string; }
```

Replace `(tag: any)` with `(tag: Tag)`.

- [ ] **Step 3: Add interface for favorites API response**

```typescript
interface FavoriteMovie { id: number; title: string; slug: string; thumbnailUrl: string; }
```

Replace `(old: any)` with `(old: { movies: FavoriteMovie[] } | undefined)` and `(m: any)` with `(m: FavoriteMovie)`.
