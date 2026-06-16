# TMDB Movie Enrichment — Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Drizzle schema with TMDB enrichment columns on the `movies` table and add `people`, `movie_cast`, and `movie_crew` tables.

**Architecture:** Pure schema extension — all new columns are nullable with defaults, existing tables/columns untouched. Single migration generated via `drizzle-kit`.

**Tech Stack:** Drizzle ORM (pg-core), PostgreSQL, drizzle-kit

---

### Task 1: Add TMDB columns to `movies` table

**Files:**
- Modify: `src/db/schema.ts` (lines 67-78)

- [ ] **Step 1: Add import for `numeric` to the drizzle-orm/pg-core imports**

Currently:
```typescript
import { pgTable, text, timestamp, boolean, uniqueIndex, integer, serial, varchar, date, primaryKey, index } from "drizzle-orm/pg-core";
```

Change to:
```typescript
import { pgTable, text, timestamp, boolean, uniqueIndex, integer, serial, varchar, date, primaryKey, index } from "drizzle-orm/pg-core";
```

- [ ] **Step 2: Add TMDB columns to the `movies` table definition**

After the `updatedAt` column in the movies table, add:

```typescript
  tmdbId: integer("tmdb_id").unique(),
  originalLanguage: varchar("original_language", { length: 10 }),
  backdropUrl: text("backdrop_url"),
```

The full movies table should now look like:
```typescript
export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  releaseDate: date("release_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tmdbId: integer("tmdb_id").unique(),
  originalLanguage: varchar("original_language", { length: 10 }),
  backdropUrl: text("backdrop_url"),
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add TMDB enrichment columns to movies table"
```

### Task 2: Add `people` table

**Files:**
- Modify: `src/db/schema.ts` (after movies block)

- [ ] **Step 1: Add the `people` table definition after the `movies` table**

```typescript
export const people = pgTable("people", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  profileUrl: text("profile_url"),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add people table for TMDB cast/crew"
```

### Task 3: Add `movie_cast` table

**Files:**
- Modify: `src/db/schema.ts` (after people table)

- [ ] **Step 1: Add the `movieCast` table definition after the `people` table**

```typescript
export const movieCast = pgTable("movie_cast", {
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  personId: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  characterName: varchar("character_name", { length: 255 }).notNull(),
  orderBilling: integer("order_billing"),
}, (t) => [
  primaryKey({ columns: [t.movieId, t.personId, t.characterName] }),
]);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add movie_cast junction table"
```

### Task 4: Add `movie_crew` table

**Files:**
- Modify: `src/db/schema.ts` (after movieCast table)

- [ ] **Step 1: Add the `movieCrew` table definition after the `movieCast` table**

```typescript
export const movieCrew = pgTable("movie_crew", {
  movieId: integer("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  personId: integer("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "cascade" }),
  department: varchar("department", { length: 100 }).notNull(),
  job: varchar("job", { length: 100 }).notNull(),
}, (t) => [
  primaryKey({ columns: [t.movieId, t.personId, t.department, t.job] }),
]);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add movie_crew junction table"
```

### Task 5: Generate migration

**Files:**
- Create: `src/db/migrations/0004_<tag>.sql`
- Modify: `src/db/migrations/meta/_journal.json`
- Create: `src/db/migrations/meta/0004_snapshot.json`

- [ ] **Step 1: Generate migration with drizzle-kit**

```bash
npx drizzle-kit generate
```

Expected output:
```
2 tables
  movies ← 3 columns
  movie_cast ← 1 table
  movie_crew ← 1 table
  people ← 1 table
```

- [ ] **Step 2: Review generated migration SQL**

Open `src/db/migrations/0004_<tag>.sql` and verify it contains:
- `ALTER TABLE "movies" ADD COLUMN "tmdb_id" integer UNIQUE`
- `ALTER TABLE "movies" ADD COLUMN "original_language" varchar(10)`
- `ALTER TABLE "movies" ADD COLUMN "backdrop_url" text`
- `CREATE TABLE "people"`
- `CREATE TABLE "movie_cast"` with composite PK and FKs
- `CREATE TABLE "movie_crew"` with composite PK and FKs

- [ ] **Step 3: Commit migration**

```bash
git add src/db/migrations/
git commit -m "chore: generate migration for TMDB enrichment"
```

### Task 6: Apply migration

- [ ] **Step 1: Push migration to database**

```bash
npx drizzle-kit push
```

Expected: Migration applied successfully.

- [ ] **Step 2: Verify in database**

Connect and verify:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'movies' 
ORDER BY ordinal_position;
```

Confirm `tmdb_id`, `original_language`, `backdrop_url` are present.

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('people', 'movie_cast', 'movie_crew');
```

Confirm all three new tables exist.

- [ ] **Step 3: Commit final state**

```bash
git add -A
git commit -m "chore: apply migration 0004"
```

## Rollback Plan

If migration fails:
```bash
npx drizzle-kit drop    # drops all tables — careful!
# OR manually revert the last migration:
# Run the DOWN SQL from 0004_<tag>.sql against the database
git checkout HEAD~1 -- src/db/schema.ts
npx drizzle-kit generate  # generates a reversal
```
