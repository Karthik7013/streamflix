# Search & Tags Redesign

## Overview

Redesign the explore page to focus on tag-based navigation with image cards, add PostgreSQL full-text search with an autocomplete dropdown, and create dedicated tag pages with movie listings.

## Goals

1. Replace tag pills with image-backed tag cards on the explore page
2. Add PostgreSQL full-text search on movie titles with autocomplete dropdown
3. Create dedicated tag pages (`/tags/[slug]`) with hero banner + infinite-scroll movie grid
4. Remove movie grid from the explore page (explore becomes tag-only browsing + search)
5. Add image URL support to tags via admin panel

## Non-Goals

- Tag-based filtering on explore (tags are navigation, not filters)
- Full-text search on description (title only)
- Series search/autocomplete (movies only for now)
- External search services (Algolia, Meilisearch, etc.)

---

## 1. Database Changes

### Tags Table

Add `imageUrl` column:

```sql
ALTER TABLE tags ADD COLUMN image_url TEXT;
```

- Optional — tags can exist without images
- Stores an external URL (same pattern as movie thumbnails)
- Admin provides URL, no file upload

### Movies Table

Add stored generated `tsvector` column for full-text search:

```sql
ALTER TABLE movies ADD COLUMN title_search TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, ''))) STORED;

CREATE INDEX idx_movies_title_search ON movies USING GIN (title_search);
```

**Why stored generated column:**
- PostgreSQL automatically keeps `title_search` in sync when `title` changes
- No application-level trigger needed
- GIN index enables fast `@@` queries

**Why `english` dictionary:**
- Handles stemming ("running" matches "run")
- Stops common words ("the", "a", "an")
- Appropriate for English-language movie titles

### Migration

Generate via `npm run db:generate`, apply via `npm run db:migrate`.

---

## 2. Search API

### Endpoint

`GET /api/search?q=...`

**Query params:**
- `q` (string, required) — search query, minimum 2 characters

**Response:**
```json
{
  "data": [
    { "id": 1, "title": "The Dark Knight", "slug": "the-dark-knight", "thumbnailUrl": "..." }
  ]
}
```

**Error response:**
```json
{ "error": { "message": "Query too short", "code": "VALIDATION_ERROR" } }
```

### Service Layer

New file: `src/services/search.ts`

```ts
export async function searchAutocomplete(q: string): Promise<SearchResult[]> {
  // plainto_tsquery handles stemming and stop words
  // ts_rank returns relevance score
  // LIMIT 10 for dropdown
}
```

**SQL:**
```sql
SELECT id, title, slug, thumbnail_url
FROM movies
WHERE published = true
  AND title_search @@ plainto_tsquery('english', :query)
ORDER BY ts_rank(title_search, plainto_tsquery('english', :query)) DESC
LIMIT 10;
```

### Typed API Client

New file: `src/lib/api/search.ts`

```ts
export const searchApi = {
  autocomplete: (q: string) =>
    apiFetch<SearchResult[]>("/api/search", { params: { q } }),
};
```

### Hook

New file: `src/hooks/use-search-autocomplete.ts`

```ts
export function useSearchAutocomplete(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: async () => {
      const { data } = await searchApi.autocomplete(q);
      return data;
    },
    enabled: q.length >= 2,
    staleTime: STALE.FAST,  // 30 seconds
  });
}
```

---

## 3. Explore Page Redesign

### Route

`src/app/(main)/explore/page.tsx` — unchanged (server component wrapper)

### Components to Modify

**`ExploreContent`** (`src/app/(main)/explore/explore-content.tsx`):
- Remove: `useMovieSearch`, `useFilterParams`, sort dropdown, `MovieGrid`
- Add: Tag cards grid, `SearchDropdown`
- Keep: `useTags()` for fetching tags
- Layout: SearchBar at top → Tag cards grid below

### New Components

**`TagCard`** — renders a single tag as a clickable card:
- Image (aspect-ratio 16/9 or square), tag name below
- Links to `/tags/{slug}`
- Blank placeholder when no `imageUrl`
- Uses `memo()` since rendered in a grid

**`SearchDropdown`** — autocomplete results below search bar:
- Shows up to 10 results
- Each result: small thumbnail + title
- Click navigates to `/movies/{slug}`
- Closes on blur or when query < 2 chars
- 300ms debounce (reuse `useDebounce`)

### Tag Cards Grid

```
grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4
```

Each card:
- Image container with aspect-ratio
- Tag name below image
- Hover effect (scale or shadow)
- Blank placeholder (gray box) when no image

### Removed

- `TagFilter` component from explore (keep for admin use only)
- `MovieGrid` component from explore
- Sort dropdown
- `useFilterParams` hook from explore
- `useMovieSearch` hook from explore

---

## 4. Tag Page

### Route

`src/app/(main)/tags/[slug]/page.tsx` — new page

### Layout

1. **Hero banner**: Full-width tag image with gradient overlay, tag name centered, movie count below
2. **Movie grid**: Same layout as current explore (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4`)
3. **Infinite scroll**: Reuse `useInfiniteScroll` pattern with `IntersectionObserver`
4. **Back button**: Navigate back to `/explore`

### API Endpoint

`GET /api/tags/[slug]/movies?page=1&limit=12`

**Response:**
```json
{
  "data": [{ "id": 1, "title": "...", "slug": "...", "thumbnailUrl": "...", "tags": [...] }],
  "meta": { "page": 1, "limit": 12, "total": 24, "totalPages": 2, "hasMore": true }
}
```

### Service Layer

New function in `src/services/tags.ts`:

```ts
export async function getMoviesByTag(slug: string, page: number, limit: number) {
  // 1. Look up tag by slug
  // 2. Use paginatedList with tag filter pre-set
  // 3. attachTags() for batch tag loading
}
```

### Components

**`TagHero`** — hero banner:
- Full-width image from tag's `imageUrl`
- Gradient overlay for text readability
- Tag name (large, centered)
- Movie count below name
- Blank/gray placeholder when no image

**`TagMovieGrid`** — movie listing:
- Same pattern as current `MovieGrid`
- Infinite scroll with `IntersectionObserver`
- Skeleton loading state
- Empty state when no movies under tag

### Caching

- API: `Cache-Control: public, max-age=300` (5 min)
- React Query: `staleTime: STALE.DEFAULT` (5 min)

---

## 5. Admin Changes

### Tag Create/Edit Forms

**`CreateTagForm`** (`src/app/admin/tags/create-tag-form.tsx`):
- Add `imageUrl` text input (optional)
- URL validation (valid URL or empty)

**Tag edit dialog** (in `useAdminTagsPage`):
- Add `imageUrl` field

### Tags Table

**`TagsTable`** (`src/app/admin/tags-table.tsx`):
- Add image column showing thumbnail preview
- Blank placeholder when no imageUrl

### API

Existing endpoints accept `imageUrl` in request body:
- `POST /api/admin/tags` — create with imageUrl
- `PUT /api/admin/tags/[id]` — update with imageUrl

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/services/search.ts` | Autocomplete service |
| `src/lib/api/search.ts` | Typed API client |
| `src/hooks/use-search-autocomplete.ts` | React Query hook |
| `src/app/(main)/explore/tag-card.tsx` | Tag card component |
| `src/app/(main)/explore/search-dropdown.tsx` | Autocomplete dropdown |
| `src/app/(main)/tags/[slug]/page.tsx` | Tag page (server) |
| `src/app/(main)/tags/[slug]/tag-content.tsx` | Tag page (client) |
| `src/app/(main)/tags/[slug]/tag-hero.tsx` | Hero banner |
| `src/app/(main)/tags/[slug]/tag-movie-grid.tsx` | Movie grid |
| `src/app/api/tags/[slug]/movies/route.ts` | API endpoint |
| `src/hooks/use-tag-movies.ts` | Infinite query hook |
| `db migrations/` | Schema migration |

## Files to Modify

| File | Changes |
|------|---------|
| `src/db/schema.ts` | Add `imageUrl` to tags, `titleSearch` to movies |
| `src/app/(main)/explore/explore-content.tsx` | Remove movie grid, add tag cards + search dropdown |
| `src/app/admin/tags/create-tag-form.tsx` | Add imageUrl field |
| `src/app/admin/tags-table.tsx` | Add image column |
| `src/services/tags.ts` | Add `getMoviesByTag`, pass imageUrl in CRUD |
| `src/app/api/admin/tags/route.ts` | Accept imageUrl in POST |
| `src/app/api/admin/tags/[id]/route.ts` | Accept imageUrl in PUT |
| `src/types/index.ts` | Add `imageUrl` to Tag type |

## Files to Unimport from Explore

These files stay in the codebase (used by other pages/admin) but are no longer imported by the explore page:

| File | Action |
|------|--------|
| `src/app/(main)/explore/movie-grid.tsx` | Delete — only used by explore |
| `src/components/tag-filter.tsx` | Keep — still used by series-content.tsx, remove from explore imports |
| `src/hooks/use-movie-search.ts` | Delete — only used by explore |
| `src/hooks/use-filter-params.ts` | Keep — still used by series-content.tsx, remove from explore imports |
