# Web Series Feature Design

**Date:** 2026-06-26
**Project:** StreamFlix (better-auth-nextjs)
**Status:** Approved design

## Overview

Add web series as a separate content type alongside movies. Series have a three-level hierarchy (series → seasons → episodes) with full admin CRUD, dedicated user-facing browse and detail pages, and integration with the existing StreamflixPlayer.

---

## 1. Database Schema

Three new tables plus one junction table, appended to the existing `src/db/schema.ts`.

### `series` table
- id: serial PK
- title: varchar(255) NOT NULL
- slug: varchar(255) NOT NULL UNIQUE
- description: text
- thumbnailUrl: text NOT NULL
- backdropUrl: text
- releaseDate: date
- createdAt: timestamp DEFAULT now() NOT NULL
- updatedAt: timestamp DEFAULT now() NOT NULL

### `seasons` table
- id: serial PK
- seriesId: integer FK → series.id ON DELETE CASCADE NOT NULL
- seasonNumber: integer NOT NULL
- title: varchar(255) (optional, e.g. "Season 1: Origins")
- description: text
- thumbnailUrl: text
- releaseDate: date
- createdAt: timestamp DEFAULT now() NOT NULL
- updatedAt: timestamp DEFAULT now() NOT NULL
- UNIQUE (seriesId, seasonNumber)

### `episodes` table
- id: serial PK
- seasonId: integer FK → seasons.id ON DELETE CASCADE NOT NULL
- episodeNumber: integer NOT NULL
- title: varchar(255) NOT NULL
- slug: varchar(255) NOT NULL UNIQUE
- description: text
- videoUrl: text
- thumbnailUrl: text
- backdropUrl: text
- durationSeconds: integer
- releaseDate: date
- createdAt: timestamp DEFAULT now() NOT NULL
- updatedAt: timestamp DEFAULT now() NOT NULL
- UNIQUE (seasonId, episodeNumber)

### `series_tags` junction table
- seriesId: integer FK → series.id ON DELETE CASCADE NOT NULL
- tagId: integer FK → tags.id ON DELETE CASCADE NOT NULL
- PRIMARY KEY (seriesId, tagId)

Reuses existing `tags` table. No cast/crew, watch history, or favorites for initial release. Fully additive migration — no changes to existing tables.

---

## 2. Services Layer

New file: `src/services/series.ts`

### Functions

| Function | Description |
|----------|-------------|
| `listSeries(args)` | Paginated, searchable (ILIKE title), tag-filterable, sortable list with season/episode counts |
| `getSeriesBySlug(slug)` | Single series with tags, seasons (ordered), and episodes (ordered within each season) |
| `createSeries(data)` | Insert series + attach tags |
| `updateSeries(id, data)` | Partial update, sync tags |
| `deleteSeries(id)` | Delete series (cascades to seasons → episodes) |
| `listAdminSeries(args)` | Admin paginated view with column filters |
| `createSeason(seriesId, data)` | Insert season, auto-assign seasonNumber if not provided (MAX + 1) |
| `updateSeason(seasonId, data)` | Partial update |
| `deleteSeason(seasonId)` | Delete season (cascades to episodes) |
| `listSeasons(seriesId)` | All seasons with episode count |
| `createEpisode(seasonId, data)` | Insert episode, auto-assign episodeNumber, validate slug |
| `updateEpisode(episodeId, data)` | Partial update |
| `deleteEpisode(episodeId)` | Delete episode |
| `listEpisodes(seasonId)` | All episodes in a season, ordered by episodeNumber |

### Caching scopes

Add `series` to `src/lib/cache.ts` invalidate patterns: `series` → `series:*, series-list:*`

---

## 3. Admin API Routes

All under `/api/admin/series/`. All require admin role.

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/api/admin/series` | List series (paginated, searchable, sortable) |
| POST | `/api/admin/series` | Create series |
| PUT | `/api/admin/series/[id]` | Update series |
| DELETE | `/api/admin/series/[id]` | Delete series |
| GET | `/api/admin/series/[id]/seasons` | List seasons for a series |
| POST | `/api/admin/series/[id]/seasons` | Create season |
| PUT | `/api/admin/series/[id]/seasons/[sid]` | Update season |
| DELETE | `/api/admin/series/[id]/seasons/[sid]` | Delete season |
| GET | `/api/admin/series/[id]/seasons/[sid]/episodes` | List episodes for a season |
| POST | `/api/admin/series/[id]/seasons/[sid]/episodes` | Create episode |
| PUT | `/api/admin/series/[id]/seasons/[sid]/episodes/[eid]` | Update episode |
| DELETE | `/api/admin/series/[id]/seasons/[sid]/episodes/[eid]` | Delete episode |

File upload reuses `/api/upload/file`.

---

## 4. User-Facing API Routes

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/api/series` | List series (tag filter, search, sort, pagination) |
| GET | `/api/series/[slug]` | Series detail (seasons → episodes, tags) |

Auth required. Cache: `cacheGetOrSet` with 300s TTL.

---

## 5. Admin UI Pages

New directory: `src/app/admin/series/`

### Series List (`page.tsx`)
- Same pattern as `/admin/movies`
- `useAdminCrud<SerializedSeries>` hook
- Searchable, paginated `DataTable` with columns: thumbnail, title, season count, episode count, tags, actions
- "Add Series" button opens `SeriesDialog`

### Series Dialog (`series-dialog.tsx`)
- Reuses `UploadField`, tag toggle pills, auto-slug generation
- Fields: title, slug, description, thumbnail, backdrop, tags, releaseDate
- Below fields: embedded season management (accordion cards)
  - Each season: number, optional title, delete action, expandable episode list
  - Episode list: number, title, duration, thumbnail, play-edit-delete
  - "Add Season" / "Add Episode" buttons

### Season/Episode inline forms
- Adding a season: mini-form inline (seasonNumber auto-filled, optional title)
- Adding an episode: sub-dialog with fields mirroring movie form (title, slug, description, videoUrl, thumbnailUrl, backdropUrl, durationSeconds, releaseDate)
- Episode slugs auto-generated from series-slug + season-number + episode-title

### Nav
- Add "Series" to `admin-layout.tsx` sidebar (Lucide `Tv` icon, between Movies and Featured)

---

## 6. User-Facing Pages

### Nav
- Add "Series" tab to bottom nav (`dashboard-layout.tsx`, Lucide `Tv`, between Explore and Favorites)

### `/series` (browse)
- Matches `/explore` pattern
- `SeriesCard` grid (poster + title + season count badge)
- Tag filter pills, search via `SearchModal`, infinite scroll

### `/series/[slug]` (detail)
- Hero: backdrop, title, description, release year, tag badges
- Season accordion: collapsible sections with episode lists
  - Each episode: number, thumbnail, title, duration, play button → `/watch/series/[slug]?season=X&episode=Y`

### `/watch/series/[slug]` (player)
- Uses existing `StreamflixPlayer` with additions:
  - Top bar: series title + "S1:E2 - Title" format
  - Episode selector (dropdown or side panel)
  - "Next Episode" button (wired to next episode in series)

---

## 7. New Components

- `SeriesCard` — poster card with season count badge (in `src/components/`)
- `EpisodeRow` — list row with thumbnail, number, title, duration, play button

---

## 8. Files Changed / Created

### New files (~25)

```
src/db/schema.ts                          -- add tables (append)
src/services/series.ts                    -- all series business logic

src/app/api/series/route.ts               -- GET list
src/app/api/series/[slug]/route.ts        -- GET detail

src/app/api/admin/series/route.ts         -- GET, POST
src/app/api/admin/series/[id]/route.ts    -- PUT, DELETE
src/app/api/admin/series/[id]/seasons/route.ts       -- GET, POST
src/app/api/admin/series/[id]/seasons/[sid]/route.ts  -- PUT, DELETE
src/app/api/admin/series/[id]/seasons/[sid]/episodes/route.ts       -- GET, POST
src/app/api/admin/series/[id]/seasons/[sid]/episodes/[eid]/route.ts -- PUT, DELETE

src/app/admin/series/page.tsx             -- series list
src/app/admin/series/series-dialog.tsx    -- create/edit dialog
src/app/admin/series/series-table.tsx     -- data table
src/app/admin/series/delete-series-dialog.tsx  -- delete confirm

src/app/(main)/series/page.tsx            -- browse
src/app/(main)/series/[slug]/page.tsx     -- detail
src/app/(main)/watch/series/[slug]/page.tsx  -- player page

src/components/series-card.tsx            -- series card
```

### Modified files (~6)

```
src/lib/cache.ts                          -- add "series" cache scope
src/components/admin-layout.tsx           -- add Series nav item
src/components/dashboard-layout.tsx       -- add Series tab
src/components/streamflix-player/         -- episode navigation wiring
src/components/streamflix-player/player-controls.tsx  -- episode selector
src/components/streamflix-player/next-episode-card.tsx -- episode context
```

---

## 9. Out of Scope (Future)

- Episode cast/crew
- Series favorites
- Watch progress / auto-resume
- TMDB integration
- Episode-level tags
- Reviews/ratings
