# Changelog Page — Design

**Date:** 2026-08-20
**Status:** Approved

## Goal

Give StreamFlix a public "What's New" page showing recent features in a clean, human-friendly format. No database — content lives in a typed data module in the codebase and the page is statically prerendered.

## Decisions (user-approved)

- **Placement:** dedicated `/changelog` page under the `(legal)` route group (reuses its sticky-header layout + `SiteFooter`), linked from the footer as "What's New".
- **Storage:** typed TS data module imported by a server component (no DB, no runtime fetch).
- **UI:** adapted from the shadcnblocks "Changelog 1" block supplied by the user.
- **Seed content:** human-friendly entries describing recent shipped features.

## Implementation

### `src/content/changelog.ts` (new)
- `export interface ChangelogEntry` — `{ version, date, title, description, items?, image?, button? }` (the block's shape).
- `export const changelogEntries` — seeded entries:
  - **Version 1.1.0 · 20 Aug 2026 — Background trailers on detail pages** (auto muted trailer after ~3s, mute toggle top-right mobile / bottom-right desktop, pause on scroll/tab-hide, reduced-motion).
  - **Version 1.0.0 · 20 Aug 2026 — Smarter playback & sharing** (lock-screen media controls, player error "Go back" button, rich link previews).
- "Version 1.x.0" is a display label (the app is continuously deployed, not versioned); easy to change to month labels.

### `src/components/changelog.tsx` (new)
- Named export `Changelog`, **server component** (no `"use client"`).
- Props: `{ className?, title?, description?, entries? }`; defaults pulled from `changelogEntries`.
- Layout: sticky left column (version `Badge` + date) + right column (title, description, bulleted `items`, optional image/button).
- Base-ui adaptations (the block targeted radix):
  - Optional button rendered as `Link` styled with `buttonVariants({ variant: "link" })` (no `asChild` support in this Button).
  - Image rendered with `next/image` (fill, `aspect-video`, `object-cover`) instead of `<img>`.
  - Spacing tuned to the `(legal)` pages (`px-6 py-16`, `max-w-3xl`).
  - List `key` = `entry.version`; item `key` = index within a bulleted list.

### `src/app/(legal)/changelog/page.tsx` (new)
- `export const metadata = { title: "Changelog" }`.
- Renders `<Changelog title="Changelog" description="Get the latest updates and improvements to StreamFlix." />`.
- Inherits `(legal)/layout.tsx` (back-to-app header + footer).

### `src/components/site-footer.tsx`
- Added `What's New` link (`/changelog`) with a `Sparkles` icon, placed after "Terms of Service", matching the icon-per-link style.

### `src/app/sitemap.ts`
- Added `/changelog` to `staticPages` (`changeFrequency: "monthly"`, `priority: 0.2`).

## Notes / edge cases
- Adding future entries = editing `src/content/changelog.ts`; the page re-renders on deploy. No DB or admin needed (developer-driven, per the source discussion).
- If a future entry uses a remote `next/image` URL, the domain must be added to `next.config` `images.remotePatterns` (seed entries have no images).
- If the product team later needs to publish without deploy, the static file can be migrated into a `changelog_entries` table — out of scope today.