# TMDB Schema Integration Design

**Date:** 2026-06-16
**Project:** StreamFlix
**Status:** Approved Design

## Summary

Integrate The Movie Database (TMDB) relational schema into the existing StreamFlix PostgreSQL database using Drizzle ORM, supporting metadata enrichment for movies, TV show support, cast/crew tracking, and shared metadata catalogs — without breaking existing functionality.

## Design Approach

**Progressive Enrichment** — the existing `movies` table gains new nullable TMDB columns, while TV shows get their own dedicated tables. Cross-cutting features (favorites, watch history) get separate TV counterparts. Zero existing tables are restructured or renamed.

## Changes by Section

### 1. Movies Table Enrichment

New nullable columns added to existing `movies` table:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `tmdb_id` | `int` UNIQUE | nullable | Official TMDB movie ID |
| `imdb_id` | `varchar(20)` UNIQUE | nullable | IMDB cross-reference |
| `original_title` | `varchar(255)` | nullable | |
| `original_language` | `varchar(10)` | nullable | |
| `tagline` | `text` | nullable | |
| `budget` | `bigint` | `0` | |
| `revenue` | `bigint` | `0` | |
| `popularity` | `decimal(10,3)` | `0.000` | |
| `poster_path` | `varchar(255)` | nullable | Relative to `https://image.tmdb.org/t/p/` |
| `backdrop_path` | `varchar(255)` | nullable | Relative to `https://image.tmdb.org/t/p/` |
| `vote_average` | `decimal(3,1)` | `0.0` | |
| `vote_count` | `int` | `0` | |

**No columns removed or altered.** All existing queries, API routes, and pages continue to work.

### 2. People & Credits

```sql
people (
  id                    INT PRIMARY KEY,          -- TMDB person ID
  imdb_id               VARCHAR(20) UNIQUE,
  name                  VARCHAR(255) NOT NULL,
  biography             TEXT,
  birthday              DATE,
  deathday              DATE,
  gender                INT DEFAULT 0,       -- 0: Unspecified, 1: Female, 2: Male, 3: Non-Binary
  known_for_department  VARCHAR(100),
  popularity            DECIMAL(10,3) DEFAULT 0.000,
  profile_path          VARCHAR(255)
)

movie_cast (
  movie_id        INT NOT NULL -> movies.id ON DELETE CASCADE
  person_id       INT NOT NULL -> people.id ON DELETE CASCADE
  credit_id       VARCHAR(50) PRIMARY KEY    -- TMDB credit_id
  character_name  VARCHAR(255) NOT NULL
  cast_id         INT
  order_billing   INT                       -- billing order (0 = top star)
)

movie_crew (
  movie_id    INT NOT NULL -> movies.id ON DELETE CASCADE
  person_id   INT NOT NULL -> people.id ON DELETE CASCADE
  credit_id   VARCHAR(50) PRIMARY KEY
  department  VARCHAR(100) NOT NULL
  job         VARCHAR(100) NOT NULL
)
```

### 3. TV Shows

```sql
tv_series (
  id                  INT PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  original_name       VARCHAR(255),
  original_language   VARCHAR(10),
  overview            TEXT,
  tagline             TEXT,
  first_air_date      DATE,
  last_air_date       DATE,
  homepage            VARCHAR(500),
  in_production       BOOLEAN DEFAULT FALSE,
  status              VARCHAR(50),
  type                VARCHAR(50),
  popularity          DECIMAL(10,3) DEFAULT 0.000,
  poster_path         VARCHAR(255),
  backdrop_path       VARCHAR(255),
  number_of_seasons   INT DEFAULT 0,
  number_of_episodes  INT DEFAULT 0,
  vote_average        DECIMAL(3,1) DEFAULT 0.0,
  vote_count          INT DEFAULT 0
)

tv_seasons (
  id              INT PRIMARY KEY,
  series_id       INT NOT NULL -> tv_series.id ON DELETE CASCADE
  season_number   INT NOT NULL,
  name            VARCHAR(255),
  overview        TEXT,
  air_date        DATE,
  poster_path     VARCHAR(255),
  UNIQUE(series_id, season_number)
)

tv_episodes (
  id                INT PRIMARY KEY,
  season_id         INT NOT NULL -> tv_seasons.id ON DELETE CASCADE
  episode_number    INT NOT NULL,
  name              VARCHAR(255) NOT NULL,
  overview          TEXT,
  production_code   VARCHAR(100),
  air_date          DATE,
  runtime           INT,
  season_number     INT NOT NULL,
  still_path        VARCHAR(255),
  video_url         TEXT,                    -- Local S3 video (like movies.video_url)
  vote_average      DECIMAL(3,1) DEFAULT 0.0,
  vote_count        INT DEFAULT 0,
  UNIQUE(season_id, episode_number)
)

-- Aggregate credits (episode-level)
tv_aggregate_cast (
  credit_id           VARCHAR(50) PRIMARY KEY,
  series_id           INT NOT NULL -> tv_series.id ON DELETE CASCADE
  person_id           INT NOT NULL -> people.id ON DELETE CASCADE
  total_episode_count INT DEFAULT 0,
  roles_json          TEXT NOT NULL,         -- JSON: [{character, episode_count}]
  order_billing       INT
)

tv_aggregate_crew (
  credit_id           VARCHAR(50) PRIMARY KEY,
  series_id           INT NOT NULL -> tv_series.id ON DELETE CASCADE
  person_id           INT NOT NULL -> people.id ON DELETE CASCADE
  total_episode_count INT DEFAULT 0,
  jobs_json           TEXT NOT NULL,         -- JSON: [{job, department, episode_count}]
  department          VARCHAR(100) NOT NULL
)
```

### 4. Metadata Catalogs

```sql
genres (
  id    INT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
)

production_companies (
  id              INT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  logo_path       VARCHAR(255),
  origin_country  VARCHAR(10)
)

networks (
  id              INT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  logo_path       VARCHAR(255),
  origin_country  VARCHAR(10)
)

-- Junction tables
movie_genres (movie_id, genre_id)                    PK(movie_id, genre_id)
tv_genres (series_id, genre_id)                      PK(series_id, genre_id)
movie_production_companies (movie_id, company_id)    PK(movie_id, company_id)
tv_production_companies (series_id, company_id)      PK(series_id, company_id)
tv_networks (series_id, network_id)                  PK(series_id, network_id)
```

All junction tables cascade on delete.

### 5. Cross-Cutting Features

Existing `favorites` and `watch_history` tables remain unchanged (movie-only).

New tables for TV show support:

```sql
tv_favorites (
  user_id     TEXT NOT NULL -> user.id ON DELETE CASCADE
  series_id   INT NOT NULL -> tv_series.id ON DELETE CASCADE
  created_at  TIMESTAMP DEFAULT now(),
  PK(user_id, series_id)
)

tv_watch_history (
  id                SERIAL PRIMARY KEY,
  user_id           TEXT NOT NULL -> user.id ON DELETE CASCADE
  episode_id        INT NOT NULL -> tv_episodes.id ON DELETE CASCADE
  progress_seconds  INT DEFAULT 0,
  is_completed      BOOLEAN DEFAULT FALSE,
  watched_at        TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, episode_id)
)
```

### 6. Unchanged Tables

These tables are not modified:

- `user`, `session`, `account`, `verification` (Better Auth core)
- `tags`, `movie_tags` (internal taxonomy — parallel to TMDB genres)
- `featured_movies` (movie-only carousel)
- `movie_requests` (movie-only user requests)

## Migration Strategy

1. **Migration 0004:** Add TMDB columns to `movies`, create all new tables (`people`, `movie_cast`, `movie_crew`, `tv_series`, `tv_seasons`, `tv_episodes`, `tv_aggregate_cast`, `tv_aggregate_crew`, `genres`, `production_companies`, `networks`, all junctions, `tv_favorites`, `tv_watch_history`)
2. **No data backfill needed** — all new columns/tables are initially empty
3. **Rollback:** `drizzle-kit drop` + restore from migration 0003

## Key Design Decisions

- **`credit_id` as PK** for cast/crew tables — matches TMDB's unique contract hash
- **TMDB IDs as PKs** for `people`, `tv_series`, `tv_seasons`, `tv_episodes`, `genres`, `production_companies`, `networks` — these are external entities
- **Tags vs Genres** kept separate — tags are internal categorization, genres are TMDB taxonomy
- **Separate TV favorites/watch_history** rather than polymorphic single tables — avoids nullable FKs and CHECK constraints, simpler Drizzle relations
- **`video_url` on `tv_episodes`** — mirrors the `movies.video_url` pattern for locally-hosted content

## Future Considerations

- TMDB API sync layer (cron jobs or webhooks) to keep metadata fresh
- TV show browsing/search in the explore page
- Episode-level watch progress for TV shows
- TMDB person pages (actor/director filmography)
