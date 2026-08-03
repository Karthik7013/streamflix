# CODE_REVIEW.md — Phased Remediation Plan

Date: 2026-08-03
Source: `CODE_REVIEW.md` (347-line review, 7 categories, ~40 findings)

## Scope

Fix all actionable findings from the review, phase by phase. Each phase ends with
`npm run lint` + `npx tsc --noEmit` green, then a git commit.

## Baseline (Phase 0)

- `tsc --noEmit`: clean.
- `npm run lint`: **17 pre-existing errors** in `streamflix-player`
  (`index.tsx`, `use-video-engine.ts`, `use-player-ui.ts`) from react-hooks v6
  rules (`immutability`, `refs`, `set-state-in-effect`). Not mentioned in the
  review but blocks a green baseline — folded into Phase 2 (player hooks area).

## Phases

### Phase 1 — Type safety (entity-dialog)
- 1.1/1.2: Replace `any` in `entity-dialog.tsx` + `movie-dialog.tsx` (and
  `series-dialog.tsx`) with generic `EntityDialog<T extends EntityFormFields>`.
  New `EntityFormFields` base interface in `entity-dialog.tsx` covering shared
  fields (title, slug, description, thumbnailUrl, backdropUrl, releaseDate,
  tagIds, tmdbId, originalLanguage, published, trailerUrl?, durationSeconds?,
  videoUrl?). `FormSlotContext<T>` uses `UseFormRegister/UseFormWatch/
  UseFormSetValue/FieldErrors`. Small casts only for movie-only optional keys
  (`tmdbId`, `trailerUrl`, `durationSeconds`) in TMDB import.
- 4.5: Remove `handleDialogOpen` wrapper, pass `onOpenChange` directly.
- 6.1: Extract TMDB search block into `src/components/entity-tmdb-search.tsx`;
  extract internal `EntityBaseFields` component in same file.
- 5.7: `upload-field.tsx` preview `<img>` → `next/image` (medium; grouped here
  since file is touched by 1.4 in Phase 2 — do in Phase 2 instead, see below).

### Phase 2 — Hooks, anti-patterns, player lint
- 1.4: silent catches in `upload-field.tsx`, `admin/movies/page.tsx`,
  `use-admin-featured-movies.ts`, `use-admin-featured-series.ts` (these two get
  merged in Phase 3, so add logging there) + audit for other silent catches.
- 1.3/5.4/3.7/4.3: `use-admin-crud.ts` — accept typed `apiCall`, drop
  `cache: "no-cache"`, serialize `extraParams` in query key, drop `useMemo`
  on primitives.
- 1.5: `admin/search-input.tsx` — remove local debounce mirroring; parent owns
  debounced value.
- 1.6: `use-filter-params.ts` — derive params from `searchParams`, no dual state.
- 1.7: `use-comments.ts` — live `timeAgo` (interval tick).
- 1.8: player refs typed `| null`.
- 1.9: `use-auth-logout.ts` — ref-based in-flight guard.
- 7.2: `use-admin-dashboard.ts` — tidy return shape.
- 7.5: `use-admin-users.ts` — avoid `useSession` dep (pass `currentUserId`).
- 7.6: `use-watchlist-toggle.ts` — proper optimistic update typing.
- 7.8: `use-admin-reports.ts` / `use-admin-requests.ts` — replace
  `queueMicrotask(() => setPage(1))` with effect-driven reset.
- 4.4: `app-layout.tsx` — `useMemo` for `items`.
- **Player lint (baseline)**: move `seekRelative`/`changeVolume` into
  `useVideoEngine`; drop unused `playPendingRef`; replace `durationRef`
  render-write with effect (or drop ref, use `duration` in deps); fix
  `set-state-in-effect` in `use-player-ui.ts`; resolve `react-hooks/refs`
  errors on `video.videoRef` passed to JSX (pass ref object directly /
  restructure), verify rules; fix unused vars in `watch-series-content.tsx`.

### Phase 3 — Featured duplication
- 2.1: merge `use-admin-featured-movies.ts` + `use-admin-featured-series.ts`
  into one generic hook.
- 2.2: merge `admin/featured/page.tsx` + `admin/featured-series/page.tsx` into
  generic `FeaturedPage` component.
- 7.7: `add-featured-dialog.tsx` — `Set<number>` prop → `number[]`.

### Phase 4 — Component duplication
- 2.3 + 4.6: shared infinite-scroll sentinel (hook/component) for
  `movie-grid.tsx` / `series-grid.tsx` (also memoize scroll container).
- 2.4: shared `SORT_OPTIONS` in `src/lib/constants.ts`.
- 2.5 + 6.5: shared admin table cell renderers
  (`src/components/admin/table-cells.tsx`), reuse across admin tables.
- 2.6: shared skeleton helpers (`src/lib/skeletons.ts` or `SkeletonRow`).

### Phase 5 — Rendering perf
- 3.4 + 5.6: `media-carousel.tsx` — `useMemo` children, stable keys.
- 3.5 + 7.4: `content-growth-chart.tsx` — hoist `placeholderData`, fix
  `maxCount` NaN when empty.
- 3.6: `movie-card.tsx` / `series-card.tsx` — forward `priority`/`fetchPriority`.
- 4.1 + 7.3: `hero-carousel.tsx` — memoize slides (or buffer rendering),
  simplify timer/RAF logic.
- 4.2: `data-table.tsx` — type `onSortingChange` properly.
- 4.7: featured hooks `handleSwap` — stable callback (done in Phase 3 merge).

### Phase 6 — Services & caching
- 3.1: `services/movies.ts` `getRelatedMovies` — reuse cached detail + tags,
  no N+1.
- 3.2: `services/series.ts` — two-level cache or shorter TTL for
  seasons/episodes.
- 3.3 + 6.6: extract shared paginated-list helper; dedupe
  `searchMovies`/`listSeries`.

### Phase 7 — Verification sweep
- 5.1: client/server boundary audit of all page files.
- Re-verify no-action items: 5.2, 5.3, 5.5, 5.8, 6.2, 6.3, 6.4.
- Final full lint + typecheck + `next build` if feasible.

## Verification

- After every phase: `npm run lint` and `npx tsc --noEmit` must pass.
- Commit message per phase: `refactor: <phase summary>` (repo style: lowercase,
  prefix per change type).

## Notes / deviations from review

- Review's 5.7 (`upload-field` next/image) moved to Phase 2 since that file's
  silent catch (1.4) is fixed there too.
- Review's 4.7 (featured `handleSwap` dep) resolved inside the Phase 3 merge.
- Baseline lint errors in streamflix-player are included in Phase 2.
