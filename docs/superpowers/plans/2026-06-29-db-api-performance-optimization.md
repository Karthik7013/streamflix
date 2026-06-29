# DB & API Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce database load, API response times, and cache-miss rates across StreamFlix through indexes, query restructuring, Redis expansion, and response headers.

**Architecture:** All changes are in the service layer (`src/services/`), database schema (`src/db/`), cache layer (`src/lib/cache.ts`), and API route headers. No UI or rendering changes.

**Tech Stack:** PostgreSQL via Drizzle ORM, Upstash Redis, Next.js App Router

## Global Constraints

- Zero UI changes — no markup or CSS touched
- All Drizzle migrations generated via `drizzle-kit` (not handwritten)
- Redis falls back gracefully when unavailable (no crash)
- API routes continue returning the same response shapes after optimization
- Rate limiter falls back to in-memory Map when Redis is not configured

---

### Task 1: Database Indexes

**Files:**
- Modify: `src/db/schema.ts`
- Create: `src/db/migrations/0009_add_performance_indexes.ts` (generated)

**Interfaces:**
- Consumes: existing schema table definitions
- Produces: committed migration with pg_trgm extension + B-tree/GIN indexes

- [ ] **Step 1: Add `pg_trgm` extension and index definitions to schema.ts**

Replace the schema imports line and add a `pg_trgm` extension definition and all index definitions at the bottom of the file:

```typescript
// At top of file, after imports
import { pgTable, text, timestamp, boolean, uniqueIndex, integer, serial, varchar, date, primaryKey, index } from "drizzle-orm/pg-core";

// Add at the bottom of schema.ts, before the type exports:
export const pgTrgmExtension = sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

// Individual indexes
export const moviesTitleIdx = index("idx_movies_title_trgm").using(
  "gin",
  sql`${movies.title} gin_trgm_ops`
);
export const moviesCreatedAtIndex = index("idx_movies_created_at").on(movies.createdAt);
export const moviesReleaseDateIdx = index("idx_movies_release_date").on(movies.releaseDate);
export const favoritesUserIdIdx = index("idx_favorites_user_id").on(favorites.userId);
export const favoritesMovieIdIdx = index("idx_favorites_movie_id").on(favorites.movieId);
export const movieRequestsUserIdIdx = index("idx_movie_requests_user_id").on(movieRequests.userId);
export const movieRequestsStatusIdx = index("idx_movie_requests_status").on(movieRequests.status);
export const seasonsSeriesIdIdx = index("idx_seasons_series_id").on(seasons.seriesId);
export const episodesSeasonIdIdx = index("idx_episodes_season_id").on(episodes.seasonId);
export const userRoleIdx = index("idx_user_role").on(user.role);
export const movieTagsMovieIdIdx = index("idx_movie_tags_movie_id").on(movieTags.movieId);
export const peopleNameIdx = index("idx_people_name").on(people.name);
```

Note: Drizzle's `using()` method for GIN indexes requires importing `sql` — ensure it's imported at the top of the file.

- [ ] **Step 2: Generate migration**

```bash
npx drizzle-kit generate
```

Verify the generated migration file contains:
```
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_movies_title_trgm ON movies USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies (created_at);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies (release_date);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_id ON favorites (movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_requests_user_id ON movie_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_movie_requests_status ON movie_requests (status);
CREATE INDEX IF NOT EXISTS idx_seasons_series_id ON seasons (series_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON episodes (season_id);
CREATE INDEX IF NOT EXISTS idx_user_role ON "user" (role);
CREATE INDEX IF NOT EXISTS idx_movie_tags_movie_id ON movie_tags (movie_id);
CREATE INDEX IF NOT EXISTS idx_people_name ON people (name);
```

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts src/db/migrations/0009_*.ts
git commit -m "perf: add database indexes for common query paths"
```

---

### Task 2: Optimize `movies.ts` — Admin Selects, Error Handling, Select-Before-Write

**Files:**
- Modify: `src/services/movies.ts`

**Interfaces:**
- Produces: `listAdminMovies` returns same shape with fewer DB columns fetched
- Produces: `searchMovies` throws on DB error instead of silently returning empty
- Produces: `updateMovie`, `deleteMovie` use `returning()` to verify instead of extra select

- [ ] **Step 1: Restrict `listAdminMovies` select columns**

Replace `db.select().from(movies)` with explicit column selection. The admin table displays: id, title, slug, thumbnailUrl, durationSeconds, releaseDate, createdAt, updatedAt and tags.

```typescript
const moviesList = await db
  .select({
    id: movies.id,
    title: movies.title,
    slug: movies.slug,
    thumbnailUrl: movies.thumbnailUrl,
    durationSeconds: movies.durationSeconds,
    releaseDate: movies.releaseDate,
    createdAt: movies.createdAt,
    updatedAt: movies.updatedAt,
    description: movies.description,
    videoUrl: movies.videoUrl,
    backdropUrl: movies.backdropUrl,
    trailerUrl: movies.trailerUrl,
    tmdbId: movies.tmdbId,
    originalLanguage: movies.originalLanguage,
  })
```

becomes:

```typescript
const moviesList = await db
  .select({
    id: movies.id,
    title: movies.title,
    slug: movies.slug,
    thumbnailUrl: movies.thumbnailUrl,
    durationSeconds: movies.durationSeconds,
    releaseDate: movies.releaseDate,
    createdAt: movies.createdAt,
    updatedAt: movies.updatedAt,
  })
```

- [ ] **Step 2: Fix `searchMovies` error handling**

Replace `Promise.allSettled` blocks (both the tags-filtered path at line 144 and the plain search path at line 190) with `Promise.all` wrapped in try/catch:

```typescript
try {
  const [movieRows, totalRows] = await Promise.all([
    db
      .select({...})
      .from(movies)
      .where(...)
      .orderBy(orderDir)
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(movies).where(...),
  ]);
  const result = await attachTags(movieRows);
  return { movies: result, total: totalRows[0].value };
} catch (err) {
  console.error("[searchMovies] DB error:", err);
  return { movies: [], total: 0 };
}
```

Do this for both the `tagsParam` branch and the plain search branch. The key change is using `catch` with `console.error`.

- [ ] **Step 3: Remove unnecessary select-before-write in `updateMovie`**

Current pattern:
```typescript
const [existingMovie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
if (!existingMovie) return null;
// ...build updateData...
await db.update(movies).set(updateData).where(eq(movies.id, movieId));
// ...delete movieTags if needed...
const [updatedMovie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
```

Replace with:
```typescript
const oldUrls: string[] = [];

const updateData: Partial<typeof movies.$inferInsert> & { updatedAt?: Date } = {};
// ...same updateData building logic...
if (Object.keys(updateData).length === 0 && (!tagIds || !Array.isArray(tagIds))) return null;

if (Object.keys(updateData).length > 0) {
  updateData.updatedAt = new Date();
  const [updatedMovie] = await db.update(movies).set(updateData).where(eq(movies.id, movieId)).returning();
  if (!updatedMovie) return null;

  // need to get old URLs for cleanup — query them only if we're changing them
  if (videoUrl !== undefined || thumbnailUrl !== undefined || backdropUrl !== undefined) {
    const [existing] = await db
      .select({ videoUrl: movies.videoUrl, thumbnailUrl: movies.thumbnailUrl, backdropUrl: movies.backdropUrl })
      .from(movies)
      .where(eq(movies.id, movieId))
      .limit(1);
    if (existing) {
      if (videoUrl !== undefined && existing.videoUrl && videoUrl !== existing.videoUrl)
        oldUrls.push(existing.videoUrl);
      if (thumbnailUrl !== undefined && existing.thumbnailUrl && thumbnailUrl !== existing.thumbnailUrl)
        oldUrls.push(existing.thumbnailUrl);
      if (backdropUrl !== undefined && existing.backdropUrl && backdropUrl !== existing.backdropUrl)
        oldUrls.push(existing.backdropUrl);
    }
  }
}
```

Actually, let me reconsider. The existing pattern does a `db.select()` before the update to get current URLs so it can clean up old files. If I remove the upfront select but still need the old URLs, I need a targeted select. Let me keep this simpler — just remove the final `db.select()` after the update since `returning()` gives us the data:

```typescript
const [existingMovie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
if (!existingMovie) return null;

const oldUrls: string[] = [];
// ...same oldUrls logic (needs existingMovie URLs)...

const updateData: Partial<typeof movies.$inferInsert> & { updatedAt?: Date } = {};
// ...same logic...

if (Object.keys(updateData).length > 0) {
  updateData.updatedAt = new Date();
  await db.update(movies).set(updateData).where(eq(movies.id, movieId));
}

// ...tag handling...

// Remove this extra select — use _movie or returning()
// const [updatedMovie] = await db.select().from(movies).where(eq(movies.id, movieId)).limit(1);
```

The function signature returns `typeof movies.$inferSelect | null`. After the update, we already have `existingMovie` which has all the fields except updated values. The cleanest approach: use `returning()` on the update.

```typescript
if (Object.keys(updateData).length > 0) {
  updateData.updatedAt = new Date();
  const [updatedMovie] = await db.update(movies).set(updateData).where(eq(movies.id, movieId)).returning();
  // ...tag handling...
  invalidateCache("movies");
  return updatedMovie;
}

// ...tag handling if no data update...
invalidateCache("movies");
return existingMovie;
```

- [ ] **Step 4: Remove unnecessary select-before-write in `deleteMovie`**

Current pattern does `db.select()` to get URLs, then deletes. The select is necessary for getting URLs to clean up from IA S3. However the `db.select()` fetches all columns — target just the URL columns:

```typescript
const [movie] = await db
  .select({ videoUrl: movies.videoUrl, thumbnailUrl: movies.thumbnailUrl, backdropUrl: movies.backdropUrl })
  .from(movies)
  .where(eq(movies.id, movieId))
  .limit(1);
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/services/movies.ts
git commit -m "perf: optimize movies service queries — restrict selects, fix error handling, reduce round-trips"
```

---

### Task 3: Optimize `series.ts` — Parallelize Detail, Admin Selects, Select-Before-Write

**Files:**
- Modify: `src/services/series.ts`

**Interfaces:**
- Produces: `getSeriesBySlug` runs tags/seasons/episodes in parallel
- Produces: `listAdminSeries` fetches fewer columns
- Produces: `updateSeason`, `deleteSeason`, `updateEpisode`, `deleteEpisode` use `returning()`

- [ ] **Step 1: Parallelize `getSeriesBySlug`**

Current sequential pattern:
```typescript
const seriesResult = await db.select().from(series)... // 1
const tagRows = await db... // 2 (waits for 1)
const seasonRows = await db... // 3 (waits for 2)
const episodeRows = await db... // 4 (waits for 3)
```

Replace with parallel pattern:
```typescript
export async function getSeriesBySlug(slug: string) {
  const [seriesResult, tagRows] = await Promise.all([
    db.select().from(series).where(eq(series.slug, slug)).limit(1),
    db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .innerJoin(seriesTags, eq(tags.id, seriesTags.tagId))
      .innerJoin(series, eq(seriesTags.seriesId, series.id))
      .where(eq(series.slug, slug)),
  ]);

  if (seriesResult.length === 0) return null;

  const seasonRows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.seriesId, seriesResult[0].id))
    .orderBy(asc(seasons.seasonNumber));

  const seasonIds = seasonRows.map((s) => s.id);
  const episodeRows =
    seasonIds.length > 0
      ? await db
          .select()
          .from(episodes)
          .where(inArray(episodes.seasonId, seasonIds))
          .orderBy(asc(episodes.episodeNumber))
      : [];

  // ... rest stays the same
}
```

Seasons and episodes still depend on the series ID from step 1, but tags no longer waits for series.

- [ ] **Step 2: Restrict `listAdminSeries` select columns**

Replace `db.select().from(series)` with explicit columns (same pattern as Task 2 Step 1):

```typescript
const seriesList = await db
  .select({
    id: series.id,
    title: series.title,
    slug: series.slug,
    description: series.description,
    thumbnailUrl: series.thumbnailUrl,
    backdropUrl: series.backdropUrl,
    releaseDate: series.releaseDate,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  })
```

- [ ] **Step 3: Remove select-before-write in season/episode mutations**

Apply same pattern as movies. For `deleteSeason` and `deleteEpisode`, no URL cleanup needed (no IA S3 references), so just delete directly:

`deleteSeason`:
```typescript
export async function deleteSeason(seasonId: number) {
  const [deleted] = await db.delete(seasons).where(eq(seasons.id, seasonId)).returning();
  if (!deleted) return false;
  invalidateCache("series");
  return true;
}
```

`deleteEpisode`:
```typescript
export async function deleteEpisode(episodeId: number) {
  const [deleted] = await db.delete(episodes).where(eq(episodes.id, episodeId)).returning();
  if (!deleted) return false;
  invalidateCache("series");
  return true;
}
```

For `updateSeason`: the existing pattern has `db.select()` to check existence. Replace with update + returning() returning the result. If the row doesn't exist, returning() returns empty array:

```typescript
export async function updateSeason(seasonId: number, data: { ... }) {
  const updateData: Record<string, unknown> = {};
  if (data.seasonNumber !== undefined) updateData.seasonNumber = data.seasonNumber;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.releaseDate !== undefined) updateData.releaseDate = data.releaseDate;

  if (Object.keys(updateData).length === 0) return null;

  updateData.updatedAt = new Date();
  const [updated] = await db.update(seasons).set(updateData).where(eq(seasons.id, seasonId)).returning();
  if (!updated) return null;

  invalidateCache("series");
  return updated;
}
```

Same pattern for `updateEpisode`.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/services/series.ts
git commit -m "perf: optimize series service — parallelize detail query, restrict selects, reduce round-trips"
```

---

### Task 4: Optimize `stats.ts` and `tags.ts`

**Files:**
- Modify: `src/services/stats.ts`
- Modify: `src/services/tags.ts`

**Interfaces:**
- Produces: `getAdminStats` returns same shape via single query
- Produces: `listAdminTags` uses separate count query instead of leftJoin + groupBy

- [ ] **Step 1: Rewrite `getAdminStats` as single query**

Replace:
```typescript
export async function getAdminStats() {
  const [[totalMovies], [totalTags], [totalUsers], [totalAdmins]] = await Promise.all([
    db.select({ value: count() }).from(movies),
    db.select({ value: count() }).from(tags),
    db.select({ value: count() }).from(user).where(eq(user.role, "user")),
    db.select({ value: count() }).from(user).where(eq(user.role, "admin")),
  ]);

  return [
    { value: totalMovies.value },
    { value: totalTags.value },
    { value: totalUsers.value },
    { value: totalAdmins.value },
  ];
}
```

With:
```typescript
import { db } from "@/db";
import { movies, tags, user } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function getAdminStats() {
  const rows = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM ${movies}) AS total_movies,
      (SELECT COUNT(*) FROM ${tags}) AS total_tags,
      COUNT(*) FILTER (WHERE ${user.role} = 'user') AS total_users,
      COUNT(*) FILTER (WHERE ${user.role} = 'admin') AS total_admins
    FROM ${user}
  `);

  const row = rows[0] as Record<string, number>;

  return [
    { value: Number(row.total_movies) },
    { value: Number(row.total_tags) },
    { value: Number(row.total_users) },
    { value: Number(row.total_admins) },
  ];
}
```

Actually, let me use a cleaner Drizzle approach. Use `.select()` with subquery or raw SQL. Actually the cleanest approach for Drizzle is:

```typescript
export async function getAdminStats() {
  const result = await db.select({
    totalMovies: sql<number>`(SELECT COUNT(*) FROM ${movies})`,
    totalTags: sql<number>`(SELECT COUNT(*) FROM ${tags})`,
    totalUsers: sql<number>`COUNT(*) FILTER (WHERE ${user.role} = 'user')`,
    totalAdmins: sql<number>`COUNT(*) FILTER (WHERE ${user.role} = 'admin')`,
  }).from(user);

  const row = result[0];
  return [
    { value: row.totalMovies },
    { value: row.totalTags },
    { value: row.totalUsers },
    { value: row.totalAdmins },
  ];
}
```

This is cleaner — uses Drizzle's SQL template literal properly with a single query against the user table.

- [ ] **Step 2: Optimize `listAdminTags` movie count**

Current pattern uses `leftJoin` + `groupBy` which scans all of `movie_tags` for every tag row.

Replace with a separate count query:

```typescript
export async function listAdminTags(args: { ... }) {
  // ... same param parsing, where clause building ...

  const [totalResult, tagsList] = await Promise.all([
    db.select({ total: count() }).from(tags).where(whereClause),
    db
      .select({ id: tags.id, name: tags.name, createdAt: tags.createdAt })
      .from(tags)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
  ]);

  const total = totalResult[0].total;

  // Count movies per tag in a separate query
  const tagIds = tagsList.map(t => t.id);
  const counts: Record<number, number> = {};
  if (tagIds.length > 0) {
    const movieCounts = await db
      .select({
        tagId: movieTags.tagId,
        value: count(),
      })
      .from(movieTags)
      .where(inArray(movieTags.tagId, tagIds))
      .groupBy(movieTags.tagId);

    for (const c of movieCounts) {
      counts[c.tagId] = Number(c.value);
    }
  }

  const tagsWithCount = tagsList.map((t) => ({
    ...t,
    movieCount: counts[t.id] || 0,
  }));

  return { tags: tagsWithCount, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

Need to add `inArray` to the drizzle-orm import in `tags.ts`.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/services/stats.ts src/services/tags.ts
git commit -m "perf: optimize stats and tags queries — single-query stats, separate tag counts"
```

---

### Task 5: Cache Evolution — New Scopes + Granular Invalidation

**Files:**
- Modify: `src/lib/cache.ts`

**Interfaces:**
- Produces: new `admin` invalidation scope
- Produces: split `movies` scope into `movies-list`, `movie-detail`, `home`

- [ ] **Step 1: Update invalidation key constants**

Replace the existing `INVALIDATION_KEYS` with more granular scopes:

```typescript
const INVALIDATION_KEYS = {
  "movies-list": ["movies:*"],
  "movie-detail": ["movie:*"],
  home: ["home:*"],
  tags: ["tags:all", "related:*"],
  favorites: ["favorites:*"],
  requests: ["requests:*"],
  "series-list": ["series-list:*"],
  "series-detail": ["series:*"],
  admin: ["admin:*"],
} as const;
```

Update the type to `keyof typeof INVALIDATION_KEYS`.

- [ ] **Step 2: Update all callers of `invalidateCache`**

Update every call site:

| File | Old Scope | New Scope |
|---|---|---|
| `services/movies.ts:createMovie` | `"movies"` | `"movies-list"` |
| `services/movies.ts:updateMovie` | `"movies"` | `"movies-list"` |
| `services/movies.ts:deleteMovie` | `"movies"` | `"movies-list"` |
| `services/featured.ts:addFeatured` | `"featured"` | `"home"` |
| `services/featured.ts:updateFeatured` | `"featured"` | `"home"` |
| `services/featured.ts:deleteFeatured` | `"featured"` | `"home"` |
| `services/favorites.ts:toggleFavorite` | `"favorites"` | `"favorites"` |
| `services/requests.ts:createRequest` | `"requests"` | `"requests"` |
| `services/requests.ts:fulfillRequest` | `"requests"` | `"requests"` |
| `services/requests.ts:deleteRequest` | `"requests"` | `"requests"` |
| `services/tags.ts:createTag` | `"tags"` | `"tags"` |
| `services/tags.ts:updateTag` | `"tags"` | `"tags"` |
| `services/tags.ts:deleteTag` | `"tags"` | `"tags"` |
| `services/series.ts:createSeries` | `"series"` | `"series-list"` |
| `services/series.ts:updateSeries` | `"series"` | `"series-list"` |
| `services/series.ts:deleteSeries` | `"series"` | `"series-list"` |
| `services/series.ts:createSeason` | `"series"` | `"series-detail"` |
| `services/series.ts:updateSeason` | `"series"` | `"series-detail"` |
| `services/series.ts:deleteSeason` | `"series"` | `"series-detail"` |
| `services/series.ts:createEpisode` | `"series"` | `"series-detail"` |
| `services/series.ts:updateEpisode` | `"series"` | `"series-detail"` |
| `services/series.ts:deleteEpisode` | `"series"` | `"series-detail"` |

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build succeeds, no "is not assignable" errors on the scope parameter.

- [ ] **Step 4: Commit**

```bash
git add src/lib/cache.ts src/services/*.ts
git commit -m "perf: granular cache invalidation scopes — split movies, series, home"
```

---

### Task 6: Cache-Control Headers on API Routes

**Files:**
- Modify: all API route files missing Cache-Control headers

**Interfaces:**
- No behavioral change — only HTTP response headers added

- [ ] **Step 1: Add Cache-Control header to remaining GET routes**

Add `{ headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } }` to the `NextResponse.json()` or `Response.json()` in these routes:

- `src/app/api/movies/[slug]/route.ts` — add header to movie detail response
- `src/app/api/series/[slug]/route.ts` — add header to series detail response
- `src/app/api/series/route.ts` — add header to series list response
- `src/app/api/favorites/route.ts` — add header to favorites response
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/movies/route.ts`
- `src/app/api/admin/series/route.ts`
- `src/app/api/admin/tags/route.ts`
- `src/app/api/admin/requests/route.ts`
- `src/app/api/admin/featured/route.ts`
- `src/app/api/admin/recent-signups/route.ts`
- `src/app/api/admin/most-favorited/route.ts`

For routes using `Response.json()` (not `NextResponse.json()`), wrap with `NextResponse.json()` or add headers via the second argument:

```typescript
return Response.json(result, {
  headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" }
});
```

For routes already using `NextResponse.json()`, add the headers option:
```typescript
return NextResponse.json(result, {
  headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" }
});
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/
git commit -m "perf: add Cache-Control headers to all GET API routes"
```

---

### Task 7: Redis-Backed Rate Limiter

**Files:**
- Modify: `src/lib/rate-limit.ts`
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes: `@upstash/redis` (already a dependency)
- Produces: `rateLimit()` is now async, uses Redis when available, falls back to Map

- [ ] **Step 1: Rewrite `rate-limit.ts`**

```typescript
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();

  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));
      }
      return { allowed: current <= limit };
    } catch {
      // Redis unavailable — fall through to memory store
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  return { allowed: entry.count <= limit };
}
```

- [ ] **Step 2: Update `proxy.ts` to await the async function**

Replace:
```typescript
export function proxy(request: NextRequest) {
```
With:
```typescript
export async function proxy(request: NextRequest) {
```

Replace:
```typescript
  const { allowed } = rateLimit(`api:${ip}`, 60, 60_000);
```
With:
```typescript
  const { allowed } = await rateLimit(`api:${ip}`, 60, 60_000);
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: build succeeds, no "rateLimit is async but not awaited" errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/rate-limit.ts src/proxy.ts
git commit -m "perf: upgrade rate limiter to use Redis with in-memory fallback"
```

