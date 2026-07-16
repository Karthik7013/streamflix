# Movie Draft/Publish Workflow

## Objective

Add a draft/publish workflow for movies so admin can distinguish which movies have uploaded videos, and unpublished movies are hidden from users.

## Scope

**In scope (movies only):**
- Database: add `published` boolean column
- Migration: seed existing records
- Admin movie list: status badge + filter tabs (All / Draft / Published)
- Admin edit form: "Published" toggle checkbox
- Public API: list endpoints filter `published = true`
- Movie detail API: returns all movies (detail page handles visibility)

**Out of scope:**
- Series episodes (future)
- Upload integration (remains manual to IA)
- Watch page changes (already handles unavailable gracefully)

## Schema Change

```sql
ALTER TABLE movies ADD COLUMN published boolean NOT NULL DEFAULT false;
```

## Migration

- Existing movies with `videoUrl IS NOT NULL` → `published = true`
- Existing movies with `videoUrl IS NULL` → `published = false`

## Admin UI

### Movie list page (`src/app/admin/movies/page.tsx`)
- **Status badge**: Each row shows a colored badge (`Draft` in yellow/amber, `Published` in green) in a new column
- **Filter tabs**: Row of tabs above the table: `All | Draft | Published`
  - "All" — no filter (default)
  - "Draft" — shows only `published = false`
  - "Published" — shows only `published = true`

### Movie edit dialog (`src/components/movie-dialog.tsx` + `entity-dialog.tsx`)
- Add a **Published** checkbox/switch inside the dialog
- Position: near the bottom, before the submit button
- Default on create: unchecked (`false`)
- Admin can toggle it when editing
- The switch/checkbox should be visually clear (green when on, gray when off) with label "Published"

## Public API Queries

All list endpoints that return movies must filter `WHERE published = true`:
- `/api/movies` — movie listing
- `/api/home/recently-added` — home page recent additions
- `/api/movies/[slug]/related` — related movies
- `/api/favorites` — user favorites

The detail endpoint `/api/movies/[slug]` does NOT filter — it returns the movie regardless of published state. The watch page already checks `videoUrl` and shows "not available" for draft movies.

## Services

- `createMovie`: sets `published: false` by default
- `updateMovie`: accepts optional `published` field
- `getMovies` / `getRecentMovies` / `getRelatedMovies`: add `eq(movies.published, true)` to the query

## What Doesn't Change

- Movie creation form fields
- IA upload mechanism
- Watch page / player
- Series and episodes

## Files to Modify

| File | Change |
|------|--------|
| `src/db/schema.ts` | Add `published` column to movies table |
| `src/db/migrations/` | New migration file |
| `src/lib/schemas.ts` | Add `published` to movie form and API schemas |
| `src/types.ts` | Add `published` to Movie interface |
| `src/services/movies.ts` | Add `published` default on create, allow update, filter lists |
| `src/services/home.ts` | Filter recent movies by `published` |
| `src/services/favorites.ts` | Filter favorites by `published` |
| `src/app/api/admin/movies/route.ts` | No change needed (already uses service) |
| `src/app/api/admin/movies/[id]/route.ts` | No change needed (already uses service) |
| `src/app/admin/movies/page.tsx` | Add filter tabs, pass filter to table |
| `src/app/admin/movies-table.tsx` | Add status badge column (Draft/Published) |
| `src/app/admin/movies/page.tsx` | Add filter tabs state + pass to MoviesTable |
| `src/components/movie-dialog.tsx` | Add Published toggle checkbox (via children slot in EntityDialog) |
| `src/lib/schemas.ts` | Add `published: z.boolean().optional()` to both movieFormSchema and createMovieApiSchema |
| `src/app/api/admin/movies/[id]/route.ts` | Accept `published` in update payload |
