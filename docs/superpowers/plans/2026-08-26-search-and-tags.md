# Search & Tags Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the explore page with tag image cards and PostgreSQL full-text search autocomplete, and create dedicated tag pages with movie listings.

**Architecture:** Add `imageUrl` to tags table, add `tsvector` generated column to movies for full-text search, create a dedicated `/api/search` autocomplete endpoint, replace explore page movie grid with tag cards grid, and create `/tags/[slug]` pages with hero banners and infinite-scroll movie grids.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, PostgreSQL (tsvector/tsquery), React Query, Tailwind CSS

---

## Task 1: Database Schema Changes

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add `imageUrl` to tags table and `titleSearch` to movies table**

Open `src/db/schema.ts`. In the `tags` table definition, add `imageUrl`:

```ts
tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

In the `movies` table definition, add `titleSearch` as a stored generated column. Add this inside the column definitions:

```ts
titleSearch: text("title_search"),
```

Note: Drizzle doesn't natively support `GENERATED ALWAYS AS` columns well. We'll add the tsvector column and GIN index via raw SQL in the migration instead. For now, just add the `imageUrl` to tags. We'll handle the tsvector column in the migration SQL directly.

Also update the `getAllTags` select in `src/services/tags.ts` to include `slug` and `imageUrl`:

```ts
export async function getAllTags() {
  return cacheGetOrSet("tags:all", CACHE_TTL.SLOW, () =>
    db.select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt }).from(tags)
  );
}
```

And update the `listAdminTags` select to include `slug` and `imageUrl`:

```ts
db
  .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
  .from(tags)
```

- [ ] **Step 2: Generate and apply migration**

Run: `npm run db:generate`

Then manually edit the generated migration SQL to add the tsvector column and GIN index. Add these lines to the migration file:

```sql
ALTER TABLE movies ADD COLUMN title_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

CREATE INDEX idx_movies_title_search ON movies USING GIN (title_search);
```

Run: `npm run db:migrate`

- [ ] **Step 3: Update Tag type**

In `src/types/index.ts`, add `imageUrl` to the `Tag` interface:

```ts
export interface Tag {
  id: number;
  name: string;
  imageUrl?: string | null;
  createdAt?: string;
  movieCount?: number;
}
```

- [ ] **Step 4: Update tag schemas**

In `src/lib/schemas.ts`, add `imageUrl` to `createTagApiSchema` and `updateTagApiSchema`:

```ts
export const createTagApiSchema = z.object({
  name: z.string().min(1, "Name is required."),
  imageUrl: z.string().url("Invalid URL.").or(z.literal("")).optional(),
})

export const updateTagApiSchema = createTagApiSchema.partial()
```

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/services/tags.ts src/types/index.ts src/lib/schemas.ts
git commit -m "feat: add imageUrl to tags, add tsvector full-text search column to movies"
```

---

## Task 2: Search Service & API Route

**Files:**
- Create: `src/services/search.ts`
- Create: `src/app/api/search/route.ts`

- [ ] **Step 1: Create the search service**

Create `src/services/search.ts`:

```ts
import { db } from "@/db";
import { movies } from "@/db/schema";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/logger";

export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
}

export async function searchAutocomplete(q: string): Promise<SearchResult[]> {
  try {
    const results = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        thumbnailUrl: movies.thumbnailUrl,
      })
      .from(movies)
      .where(
        sql`${movies.titleSearch} @@ plainto_tsquery('english', ${q}) AND ${movies.published} = true`
      )
      .orderBy(sql`ts_rank(${movies.titleSearch}, plainto_tsquery('english', ${q})) DESC`)
      .limit(10);

    return results;
  } catch (err) {
    logger.error("searchAutocomplete", "DB error:", err);
    return [];
  }
}
```

- [ ] **Step 2: Create the API route**

Create `src/app/api/search/route.ts`:

```ts
import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { searchAutocomplete } from "@/services/search";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withPublic(async (request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json(
      { error: { message: "Query too short", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  const data = await searchAutocomplete(q);
  return NextResponse.json({ data }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Search failed", code: "INTERNAL_ERROR" });
```

- [ ] **Step 3: Commit**

```bash
git add src/services/search.ts src/app/api/search/route.ts
git commit -m "feat: add search autocomplete API endpoint with full-text search"
```

---

## Task 3: Search API Client & Hook

**Files:**
- Create: `src/lib/api/search.ts`
- Create: `src/hooks/use-search-autocomplete.ts`

- [ ] **Step 1: Create the typed API client**

Create `src/lib/api/search.ts`:

```ts
import { api } from "@/lib/api/client";
import type { SearchResult } from "@/services/search";

export const searchApi = {
  autocomplete: (q: string) =>
    api<{ data: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`),
};
```

- [ ] **Step 2: Create the React Query hook**

Create `src/hooks/use-search-autocomplete.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { searchApi } from "@/lib/api/search";
import type { SearchResult } from "@/services/search";

export function useSearchAutocomplete(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      const { data } = await searchApi.autocomplete(q);
      return data;
    },
    enabled: q.length >= 2,
    staleTime: STALE.FAST,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/search.ts src/hooks/use-search-autocomplete.ts
git commit -m "feat: add search API client and autocomplete hook"
```

---

## Task 4: SearchDropdown Component

**Files:**
- Create: `src/app/(main)/explore/search-dropdown.tsx`

- [ ] **Step 1: Create the SearchDropdown component**

Create `src/app/(main)/explore/search-dropdown.tsx`:

```tsx
"use client";

import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchAutocomplete } from "@/hooks/use-search-autocomplete";
import { skeletonItems } from "@/lib/skeletons";

const SKELETON_ITEMS = skeletonItems(5);

export const SearchDropdown = memo(function SearchDropdown({
  query,
  onClose,
}: {
  query: string;
  onClose: () => void;
}) {
  const { data: results, isLoading } = useSearchAutocomplete(query);
  const items = results ?? [];

  if (query.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/50 bg-background shadow-lg overflow-hidden">
      {isLoading ? (
        <div className="p-2 space-y-1">
          {SKELETON_ITEMS.map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="size-10 rounded-md shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No results found.
        </div>
      ) : (
        <div className="p-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/movies/${item.slug}`}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                <ShimmerImage
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="40px"
                  imgClassName="object-cover"
                  wrapperClassName="absolute inset-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-sm font-medium truncate">{item.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(main\)/explore/search-dropdown.tsx
git commit -m "feat: add SearchDropdown component for autocomplete"
```

---

## Task 5: TagCard Component

**Files:**
- Create: `src/app/(main)/explore/tag-card.tsx`

- [ ] **Step 1: Create the TagCard component**

Create `src/app/(main)/explore/tag-card.tsx`:

```tsx
"use client";

import Link from "next/link";
import { memo } from "react";
import { ShimmerImage } from "@/components/shimmer-image";
import type { Tag } from "@/types";

export const TagCard = memo(function TagCard({ tag }: { tag: Tag }) {
  return (
    <Link href={`/tags/${tag.slug}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        {tag.imageUrl ? (
          <ShimmerImage
            src={tag.imageUrl}
            alt={tag.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            imgClassName="object-cover transition-transform group-hover:scale-105"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-2xl font-bold text-muted-foreground/40">{tag.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm font-medium truncate">{tag.name}</p>
    </Link>
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(main\)/explore/tag-card.tsx
git commit -m "feat: add TagCard component with image support"
```

---

## Task 6: Redesign Explore Page

**Files:**
- Modify: `src/app/(main)/explore/explore-content.tsx`
- Delete: `src/app/(main)/explore/movie-grid.tsx`
- Delete: `src/hooks/use-movie-search.ts`

- [ ] **Step 1: Rewrite ExploreContent**

Replace the entire content of `src/app/(main)/explore/explore-content.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SearchBar } from "@/app/(main)/explore/search-bar";
import { SearchDropdown } from "@/app/(main)/explore/search-dropdown";
import { TagCard } from "@/app/(main)/explore/tag-card";
import { useTags } from "@/hooks/use-tags";
import { useDebounce } from "@/hooks/use-debounce";
import { skeletonItems } from "@/lib/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const SKELETON_ITEMS = skeletonItems(10);

export function ExploreContent() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const tags = useTags();

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
        <div className="relative">
          <SearchBar value={q} onChange={setQ} />
          {debouncedQ.length >= 2 && (
            <SearchDropdown query={debouncedQ} onClose={() => setQ("")} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tags.loading
          ? SKELETON_ITEMS.map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-video rounded-xl" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          : tags.data.map((tag) => <TagCard key={tag.id} tag={tag />)}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete movie-grid.tsx**

Delete `src/app/(main)/explore/movie-grid.tsx`:

```bash
rm src/app/\(main\)/explore/movie-grid.tsx
```

- [ ] **Step 3: Delete use-movie-search.ts**

Delete `src/hooks/use-movie-search.ts`:

```bash
rm src/hooks/use-movie-search.ts
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: redesign explore page with tag cards and search dropdown"
```

---

## Task 7: Tag Page — API Route & Service

**Files:**
- Create: `src/app/api/tags/[slug]/movies/route.ts`
- Modify: `src/services/tags.ts`

- [ ] **Step 1: Add `getMoviesByTag` to tags service**

Add this function to `src/services/tags.ts`:

```ts
import { db } from "@/db";
import { tags, movieTags, movies } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { paginatedList } from "@/services/paginated-list";
import { moviesListConfig } from "@/services/config";
import { attachTags } from "@/services/movies";

// ... existing functions above ...

export async function getTagBySlug(slug: string) {
  const [tag] = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt })
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);
  return tag ?? null;
}

export async function getMoviesByTag(slug: string, page: number, limit: number) {
  const tag = await getTagBySlug(slug);
  if (!tag) return { error: { message: "Tag not found", code: "NOT_FOUND" } };

  const tagIdParam = String(tag.id);
  const result = await paginatedList<{
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
  }>({
    config: moviesListConfig,
    select: {
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
    },
    table: movies,
    junction: movieTags,
    junctionFk: movieTags.movieId,
    junctionTagId: movieTags.tagId,
    bodyId: movies.id,
    searchColumn: movies.title,
    conditions: [eq(movies.published, true)],
    tagsParam: tagIdParam,
    page,
    limit,
    errorContext: "getMoviesByTag",
  });

  const data = await attachTags(result.data);
  return { data, meta: result.meta, tag };
}
```

Note: We also need to add `slug` to the tags table. Let me add that to Task 1. Actually, looking at the current schema, tags don't have a `slug` column. We need to either:
1. Add a `slug` column to tags (generated from name)
2. Or compute the slug from the name in the service

Let me add a `slug` column. Update the tags table in `src/db/schema.ts`:

```ts
tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

And update the migration to add:
```sql
ALTER TABLE tags ADD COLUMN slug VARCHAR(50) NOT NULL UNIQUE;
UPDATE tags SET slug = LOWER(REPLACE(REPLACE(TRIM(name), ' ', '-'), '.', ''));
```

Also update `createTag` in `src/services/tags.ts` to generate slug:

```ts
export async function createTag(name: string, imageUrl?: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [createdTag] = await db.insert(tags).values({ name: name.trim(), slug, imageUrl: imageUrl || null }).returning();
  return createdTag;
}
```

And update `updateTag` to handle imageUrl:

```ts
export async function updateTag(tagId: number, name?: string, imageUrl?: string) {
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return { error: { message: "Invalid name", code: "INVALID_NAME" } };
    updates.name = name.trim();
    updates.slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
  if (imageUrl !== undefined) {
    updates.imageUrl = imageUrl || null;
  }
  if (Object.keys(updates).length > 0) {
    await db.update(tags).set(updates).where(eq(tags.id, tagId));
  }

  const [updatedTag] = await db.select({ id: tags.id, name: tags.name, slug: tags.slug, imageUrl: tags.imageUrl, createdAt: tags.createdAt }).from(tags).where(eq(tags.id, tagId)).limit(1);
  if (!updatedTag) return { error: { message: "Tag Not Found", code: "NOT_FOUND" } };

  return { tag: updatedTag };
}
```

- [ ] **Step 2: Create the tag movies API route**

Create `src/app/api/tags/[slug]/movies/route.ts`:

```ts
import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { getMoviesByTag } from "@/services/tags";
import { CACHE_CONTROL, safeParseInt } from "@/lib/api-utils";

export const GET = withPublic<{ slug: string }>(async (request, { params }) => {
  const { slug } = params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, safeParseInt(searchParams.get("page"), 1));
  const limit = Math.max(1, Math.min(50, safeParseInt(searchParams.get("limit"), 12)));

  const result = await getMoviesByTag(slug, page, limit);
  if ("error" in result) {
    return NextResponse.json(result, { status: 404 });
  }

  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Failed to fetch movies", code: "INTERNAL_ERROR" });
```

- [ ] **Step 3: Update admin API routes to pass imageUrl**

Update `src/app/api/admin/tags/route.ts` POST handler to pass imageUrl:

```ts
export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(createTagApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const createdTag = await createTag(parsed.data.name, parsed.data.imageUrl);
  await invalidateCache("tags");
  return NextResponse.json(createdTag, { status: 201 });
});
```

Update `src/app/api/admin/tags/[id]/route.ts` PUT handler to pass imageUrl:

```ts
export const PUT = withAdminAuth<{ id: string }>(async (request, { params }) => {
  const tagId = parseInt(params.id);
  if (isNaN(tagId)) return NextResponse.json({ error: { message: "Invalid tag ID", code: "INVALID_ID" } }, { status: 400 });
  const body = await request.json();

  const parsed = validateBody(updateTagApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const result = await updateTag(tagId, parsed.data.name, parsed.data.imageUrl);
  if ("error" in result) {
    const err = result as { error: { message: string; code: string } };
    return NextResponse.json(err, { status: err.error.code === "NOT_FOUND" ? 404 : 400 });
  }

  await invalidateCache("tags");
  return NextResponse.json({ data: result.tag });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/services/tags.ts src/app/api/tags/\[slug\]/movies/route.ts src/app/api/admin/tags/route.ts src/app/api/admin/tags/\[id\]/route.ts src/db/schema.ts
git commit -m "feat: add tag movies API, slug and imageUrl support for tags"
```

---

## Task 8: Tag Page — UI Components

**Files:**
- Create: `src/app/(main)/tags/[slug]/page.tsx`
- Create: `src/app/(main)/tags/[slug]/tag-content.tsx`
- Create: `src/app/(main)/tags/[slug]/tag-hero.tsx`
- Create: `src/app/(main)/tags/[slug]/tag-movie-grid.tsx`
- Create: `src/hooks/use-tag-movies.ts`
- Create: `src/lib/api/tags.ts` (extend existing)

- [ ] **Step 1: Create the tag movies hook**

Create `src/hooks/use-tag-movies.ts`:

```ts
"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import { api } from "@/lib/api/client";
import type { MovieCardData, PaginationMeta } from "@/types";

export function useTagMovies(slug: string) {
  const result = useInfiniteQuery({
    queryKey: ["tag-movies", slug],
    queryFn: async ({ pageParam }) => {
      const p = new URLSearchParams();
      p.set("page", String(pageParam));
      p.set("limit", "12");
      return api<{ data: MovieCardData[]; meta: PaginationMeta }>(`/api/tags/${slug}/movies?${p}`);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined),
    initialPageParam: 1,
    staleTime: STALE.DEFAULT,
    refetchOnMount: false,
  });

  const pages = result.data?.pages;
  const stableData = useMemo(
    () => (pages?.flatMap((p) => p.data) ?? []) as MovieCardData[],
    [pages]
  );

  return {
    data: stableData,
    loading: result.isLoading || result.isFetchingNextPage,
    isError: result.isError,
    retry: result.refetch,
    hasMore: result.hasNextPage,
    onLoadMore: result.fetchNextPage,
  };
}
```

- [ ] **Step 2: Create TagHero component**

Create `src/app/(main)/tags/[slug]/tag-hero.tsx`:

```tsx
import { ShimmerImage } from "@/components/shimmer-image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Tag } from "@/types";

export function TagHero({ tag, movieCount }: { tag: Tag; movieCount?: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div className="relative aspect-[3/1] sm:aspect-[4/1]">
        {tag.imageUrl ? (
          <ShimmerImage
            src={tag.imageUrl}
            alt={tag.name}
            fill
            sizes="100vw"
            imgClassName="object-cover"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-4" />
          Explore
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading">{tag.name}</h1>
        {movieCount !== undefined && (
          <p className="mt-1 text-muted-foreground">
            {movieCount} {movieCount === 1 ? "movie" : "movies"}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create TagMovieGrid component**

Create `src/app/(main)/tags/[slug]/tag-movie-grid.tsx`:

```tsx
"use client";

import { memo } from "react";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import { Search } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { skeletonItems } from "@/lib/skeletons";
import type { MovieCardData } from "@/types";

const SKELETON_ITEMS_4 = skeletonItems(4);

export const TagMovieGrid = memo(function TagMovieGrid({
  data,
  loading,
  isError,
  retry,
  hasMore,
  onLoadMore,
}: {
  data: MovieCardData[];
  loading: boolean;
  isError: boolean;
  retry: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore });

  const showError = !loading && isError && data.length === 0;
  const showEmpty = !loading && !isError && data.length === 0;

  return (
    <>
      {showError ? (
        <div className="flex justify-center py-12">
          <ErrorState message="Unable to load movies." onRetry={retry} />
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold font-heading">No movies in this tag yet.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.map((m) => (
            <MovieCard key={m.id} {...m} />
          ))}
          {loading &&
            SKELETON_ITEMS_4.map((i) => (
              <div key={"skel-" + i} className="space-y-2">
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />
    </>
  );
});
```

- [ ] **Step 4: Create the tag page server component**

Create `src/app/(main)/tags/[slug]/page.tsx`:

```tsx
import { Suspense } from "react";
import { TagContent } from "./tag-content";

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <TagContent slug={slug} />
    </Suspense>
  );
}
```

- [ ] **Step 5: Create the tag page client component**

Create `src/app/(main)/tags/[slug]/tag-content.tsx`:

```tsx
"use client";

import { TagHero } from "./tag-hero";
import { TagMovieGrid } from "./tag-movie-grid";
import { useTagMovies } from "@/hooks/use-tag-movies";
import { api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { STALE } from "@/lib/stale-times";
import type { Tag } from "@/types";

export function TagContent({ slug }: { slug: string }) {
  const movies = useTagMovies(slug);

  const { data: tag } = useQuery({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const { data } = await api<{ data: Tag }>(`/api/tags/${slug}`);
      return data;
    },
    staleTime: STALE.THIRTY_MIN,
  });

  if (!tag) {
    return (
      <div className="space-y-6">
        <div className="aspect-[3/1] sm:aspect-[4/1] rounded-2xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TagHero tag={tag} movieCount={movies.data.length} />
      <TagMovieGrid {...movies} />
    </div>
  );
}
```

- [ ] **Step 6: Create a simple tag detail API route for the hero**

Create `src/app/api/tags/[slug]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { getTagBySlug } from "@/services/tags";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withPublic<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;
  const tag = await getTagBySlug(slug);
  if (!tag) {
    return NextResponse.json({ error: { message: "Tag not found", code: "NOT_FOUND" } }, { status: 404 });
  }
  return NextResponse.json({ data: tag }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Failed to fetch tag", code: "INTERNAL_ERROR" });
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(main\)/tags/ src/hooks/use-tag-movies.ts src/app/api/tags/\[slug\]/
git commit -m "feat: add tag page with hero banner and infinite-scroll movie grid"
```

---

## Task 9: Admin Tag Form Updates

**Files:**
- Modify: `src/app/admin/tags/create-tag-form.tsx`
- Modify: `src/app/admin/tags-table.tsx`
- Modify: `src/hooks/use-admin-tags-page.ts` (if it exists for edit dialog)

- [ ] **Step 1: Update CreateTagForm to include imageUrl**

Replace `src/app/admin/tags/create-tag-form.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2Icon, CheckIcon, XIcon } from "lucide-react";

export function CreateTagForm({
  onCreate,
  onCancel,
  isPending,
}: {
  onCreate: (name: string, imageUrl?: string) => void;
  onCancel: () => void;
  isPending?: boolean;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);
  const nameValueRef = useRef("");
  const [imageUrl, setImageUrl] = useState("");

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b bg-muted/30">
      <div className="flex items-center gap-2">
        <Input
          ref={nameRef as React.Ref<HTMLInputElement>}
          defaultValue=""
          onChange={(e) => { nameValueRef.current = e.target.value }}
          placeholder="New tag name..."
          className="h-8 max-w-xs"
          autoFocus
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && nameValueRef.current.trim()) {
              onCreate(nameValueRef.current.trim(), imageUrl || undefined);
            }
            if (e.key === "Escape") onCancel();
          }}
        />
        <Input
          ref={imageUrlRef as React.Ref<HTMLInputElement>}
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL (optional)"
          className="h-8 max-w-xs"
          disabled={isPending}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={isPending}
          onClick={() => { if (nameValueRef.current.trim()) onCreate(nameValueRef.current.trim(), imageUrl || undefined) }}
        >
          {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <CheckIcon className="size-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onCancel} disabled={isPending}>
          <XIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update TagsTable to show image column**

In `src/app/admin/tags-table.tsx`, add an image column after the name column:

```ts
{
  id: "image",
  header: "Image",
  cell: ({ row }) => (
    row.original.imageUrl ? (
      <div className="relative size-10 overflow-hidden rounded-md bg-muted">
        <img
          src={row.original.imageUrl}
          alt={row.original.name}
          className="object-cover size-full"
          referrerPolicy="no-referrer"
        />
      </div>
    ) : (
      <div className="size-10 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">—</div>
    )
  ),
},
```

- [ ] **Step 3: Update adminApi.tags client to accept imageUrl**

In `src/lib/api/admin.ts`, update the tags methods:

```ts
tags: {
  list: (params: URLSearchParams) =>
    api<{ data: Tag[]; meta: PaginationMeta }>(`/api/admin/tags?${params}`),

  create: (name: string, imageUrl?: string) =>
    api<void>("/api/admin/tags", {
      method: "POST",
      body: JSON.stringify({ name, imageUrl: imageUrl || undefined }),
    }),

  update: (id: number, name: string, imageUrl?: string) =>
    api<void>(`/api/admin/tags/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, imageUrl: imageUrl || undefined }),
    }),

  delete: (id: number) =>
    api<void>(`/api/admin/tags/${id}`, { method: "DELETE" }),
},
```

- [ ] **Step 4: Update useAdminTagsPage to handle imageUrl**

In `src/hooks/use-admin-tags-page.ts`:

1. Add `editingImageUrl` state:
```ts
const [editingImageUrl, setEditingImageUrl] = useState("");
```

2. Update `startEdit` to set imageUrl:
```ts
const startEdit = useCallback((tag: Tag) => {
  setEditingId(tag.id);
  setEditingName(tag.name);
  setEditingImageUrl(tag.imageUrl || "");
  setTimeout(() => editInputRef.current?.focus(), 0);
}, []);
```

3. Update `handleCreate` to accept imageUrl:
```ts
const handleCreate = useCallback(async (name: string, imageUrl?: string) => {
  try {
    await createMutation.mutateAsync({ name, imageUrl });
    setCreating(false);
  } catch (err) { logger.error("admin-tags", "Failed to create tag", err); }
}, [createMutation]);
```

4. Update `handleSaveEdit` to send imageUrl:
```ts
const handleSaveEdit = useCallback(async () => {
  const name = editingName.trim();
  if (!name || editingId === null) return;
  const id = editingId;
  try {
    await editMutation.mutateAsync({ id, name, imageUrl: editingImageUrl || undefined });
    setEditingId(null);
    setEditingName("");
    setEditingImageUrl("");
  } catch (err) { logger.error("admin-tags", "Failed to update tag", err); }
}, [editingName, editingId, editingImageUrl, editMutation]);
```

5. Update `cancelEdit` to clear imageUrl:
```ts
const cancelEdit = useCallback(() => { setEditingId(null); setEditingName(""); setEditingImageUrl(""); }, []);
```

6. Update the `createMutation` and `editMutation` to pass imageUrl:

```ts
const createMutation = useMutation({
  mutationFn: ({ name, imageUrl }: { name: string; imageUrl?: string }) => adminApi.tags.create(name, imageUrl),
  // ... rest unchanged
});

const editMutation = useMutation({
  mutationFn: ({ id, name, imageUrl }: { id: number; name: string; imageUrl?: string }) => adminApi.tags.update(id, name, imageUrl),
  // ... rest unchanged
});
```

7. Return `editingImageUrl` and `setEditingImageUrl` from the hook.

- [ ] **Step 5: Update CreateTagForm to call onCreate with imageUrl**

The CreateTagForm `onCreate` prop type should be `(name: string, imageUrl?: string) => void`. Update the admin tags page that renders `CreateTagForm` to pass a handler that calls `handleCreate(name, imageUrl)`.

- [ ] **Step 6: Update TagsTable edit row to show imageUrl input**

In the TagsTable, when `editingId === row.original.id`, show an imageUrl input below the name input.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/tags/ src/hooks/use-admin-tags-page.ts src/lib/api/admin.ts
git commit -m "feat: add imageUrl field to admin tag create/edit forms"
```

---

## Task 10: Update Public Tags API to Include slug and imageUrl

**Files:**
- Modify: `src/app/api/tags/route.ts`
- Modify: `src/lib/api/tags.ts`

- [ ] **Step 1: Ensure public tags API returns slug and imageUrl**

The `getAllTags` service already returns `slug` and `imageUrl` after our Task 1 changes. Verify the API route passes the data correctly. The current route returns `{ data: result }` which should work.

- [ ] **Step 2: Update tags API client type**

In `src/lib/api/tags.ts`, update the return type:

```ts
import { api } from "@/lib/api/client";
import type { Tag } from "@/types";

export const tagsApi = {
  list: (params?: URLSearchParams) =>
    api<{ data: Tag[] }>(`/api/tags?${params ?? ""}`),
};
```

This already uses `Tag` type which now includes `imageUrl` and `slug`.

- [ ] **Step 3: Update cache invalidation to include new tag pages**

In `src/lib/cache.ts`, add a new scope for tag page caches:

```ts
const INVALIDATION_KEYS = {
  // ... existing entries ...
  "tag-movies": ["tag-movies:*", "tag:*"],
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tags/route.ts src/lib/api/tags.ts src/lib/cache.ts
git commit -m "feat: ensure public tags API returns slug and imageUrl"
```

---

## Task 11: Final Cleanup & Verification

**Files:**
- Various

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`

Fix any type errors.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Fix any lint errors.

- [ ] **Step 3: Verify explore page loads**

Start dev server: `npm run dev`

Navigate to `/explore` and verify:
- Tag cards display in a grid
- Search bar triggers autocomplete dropdown
- Clicking a tag navigates to `/tags/{slug}`
- Tag page shows hero banner + movie grid

- [ ] **Step 4: Verify admin tag forms**

Navigate to `/admin/tags` and verify:
- Create form has imageUrl field
- Tags table shows image column
- Edit dialog has imageUrl field

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: type errors and lint issues from search and tags redesign"
```
