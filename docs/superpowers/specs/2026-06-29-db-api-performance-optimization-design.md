# DB & API Performance Optimization

**Date:** 2026-06-29
**Project:** StreamFlix
**Scope:** Database indexes, query optimization, Redis caching expansion, API response improvements

---

## 1. Database Indexes

Add the following indexes via a Drizzle migration:

| Table | Column(s) | Index Type | Rationale |
|---|---|---|---|
| `movies` | `title` | GIN trigram (`pg_trgm`) | Powers `ilike` search in `searchMovies` and admin list |
| `movies` | `created_at` | B-tree | ORDER BY on home page, explore page |
| `movies` | `release_date` | B-tree | ORDER BY on explore page |
| `favorites` | `user_id` | B-tree | User favorites filtering, `checkFavorite` |
| `favorites` | `movie_id` | B-tree | `getMostFavorited` aggregation |
| `movie_requests` | `user_id` | B-tree | User's requests lookup |
| `movie_requests` | `status` | B-tree | Admin filtering by status |
| `seasons` | `series_id` | B-tree | Series detail — season lookup |
| `episodes` | `season_id` | B-tree | Season detail — episode lookup |
| `user` | `role` | B-tree | Admin stats counting |
| `movie_tags` | `movie_id` | B-tree | Join path movies → tags |
| `people` | `name` | B-tree | Future actor search |

Enable `pg_trgm` extension in the migration.

---

## 2. Query Optimization

### 2.1 Parallelize Series Detail (`src/services/series.ts`)

`getSeriesBySlug` currently runs 3 sequential stages: series → tags → seasons → episodes. After the initial series lookup, run tags, seasons, and episodes in parallel.

### 2.2 Restrict Admin List Selects

- `listAdminMovies` — select only needed columns instead of `db.select().from(movies)`
- `listAdminSeries` — same for series list
- Avoid fetching `videoUrl`, `description`, `backdropUrl`, `trailerUrl`, `tmdbId`, `originalLanguage` in table view queries

### 2.3 Single-Query Admin Stats

Replace 4 separate `SELECT COUNT(*)` queries with a single query using `COUNT(*) FILTER(WHERE ...)` or conditional aggregation:

```sql
SELECT
  COUNT(*) AS total_movies,
  (SELECT COUNT(*) FROM tags) AS total_tags,
  COUNT(*) FILTER (WHERE role = 'user') AS total_users,
  COUNT(*) FILTER (WHERE role = 'admin') AS total_admins
FROM "user"
```

### 2.4 Optimize Tag Count in Admin Tags List

`listAdminTags` uses `leftJoin` + `groupBy` to count movies per tag, which scans `movie_tags` for every tag. Replace with a separate count subquery or use a lateral join.

### 2.5 Fix `Promise.allSettled` Error Handling

In `searchMovies` and `listSeries`, replace `Promise.allSettled` with `Promise.all` and proper try/catch. Log the actual error before returning fallback. Currently DB failures are silently swallowed.

### 2.6 Remove Unnecessary `select().from()` Patterns

`updateMovie`, `updateSeason`, `updateEpisode`, `deleteMovie`, `deleteSeries` — each does `db.select().from(table).where(...).limit(1)` to check existence and then does the update/delete. This is an extra round-trip. Drizzle `update()...returning()` and `delete()...returning()` can indicate success via the returned row count.

---

## 3. Redis Cache Expansion

### 3.1 New Cache Entries

| Cache Key | TTL | Data | Notes |
|---|---|---|---|
| `admin:stats` | 120s | Dashboard stats | Invalidated on movie/tag/user mutations |
| `admin:recent-signups` | 120s | Recent signups | Invalidated on user mutations |

### 3.2 Granular Cache Invalidation

Split the `movies` invalidation scope into separate keys:
- `movies:list` — for movie search/list pages
- `movie:{slug}` — for individual movie detail
- `home:` — for homepage data

So that creating/updating a movie doesn't necessarily clear the home page cache, and vice versa.

### 3.3 Add `Cache-Control` headers to all remaining GET API routes

Routes missing headers:
- `/api/admin/stats`
- `/api/admin/movies`
- `/api/admin/series`
- `/api/admin/tags`
- `/api/admin/requests`
- `/api/admin/featured`
- `/api/admin/recent-signups`
- `/api/admin/most-favorited`
- `/api/series`
- `/api/series/[slug]`
- `/api/movies/[slug]`
- `/api/favorites`

---

## 4. Rate Limiter

Upgrade `src/lib/rate-limit.ts` from in-memory `Map` to use Upstash Redis when available (fall back to Map when Redis is not configured). This ensures rate limiting works across serverless function instances.

---

## 5. Files to Modify

| File | Change |
|---|---|
| `src/db/schema.ts` | Add index definitions |
| `src/db/migrations/` | New migration (generated via `drizzle-kit`) |
| `src/services/movies.ts` | Admin list selects, error handling, existence check removal |
| `src/services/series.ts` | Parallelize detail, admin list selects |
| `src/services/stats.ts` | Single-query stats |
| `src/services/tags.ts` | Optimized tag count query |
| `src/services/featured.ts` | (minor — no changes needed) |
| `src/lib/cache.ts` | New invalidation scopes |
| `src/lib/rate-limit.ts` | Redis-backed rate limiter |
| Various API route files | Add `Cache-Control` headers |

---

## 6. Non-Goals

- No UI changes
- No new features
- No rendering architecture changes (server components, ISR — that's Approach 2)
- No video pipeline changes
