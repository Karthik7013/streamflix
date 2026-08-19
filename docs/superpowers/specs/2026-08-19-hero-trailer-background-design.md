# Hero Trailer Background — Design

**Date:** 2026-08-19
**Status:** Approved

## Goal

On movie and series detail pages, show the static backdrop image first, then — if the user stays on the page — auto-play the YouTube trailer as a muted background video that replaces the backdrop. Must remain responsive on mobile and desktop, and must never block the existing content (title, buttons, thumbnail poster with hover-play dialog).

## Decisions (user-approved)

- **Sound:** Autoplay muted (browser requirement). Clicking the hero background toggles sound on/off.
- **Start trigger:** Start ~3s after the hero is in view and the tab is visible.
- **Scope:** Movies **and** series — both use the shared `DetailHero` component, so one change covers both.
- **Mobile:** Autoplay on both mobile and desktop.
- **Approach:** YouTube IFrame API via a small custom component (no new dependencies).

## Implementation

### New component: `src/components/hero-trailer-background.tsx`

- `"use client"`, named export `HeroTrailerBackground`.
- Props: `{ url: string | null }`.
- `extractYouTubeId(url)` — regex for `youtube.com/embed/`, `watch?v=`, `shorts/`, and `youtu.be/`. Non-YouTube URLs return `null` → component renders nothing (dialog still works).
- `loadYouTubeApi()` — module-level singleton that injects `https://www.youtube.com/iframe_api` once and resolves on `window.onYouTubeIframeAPIReady`. 15s timeout + script `onerror` → reject.
- Player created with `playerVars`: `controls: 0, rel: 0, iv_load_policy: 3, playsinline: 1, loop: 1, playlist: <videoId>, mute: 1`. On `onReady`: `mute()` + `playVideo()` + show transient "Tap for sound" hint (3.5s fade).
- **React-safe mount:** the mount element is created once via `useState(() => document.createElement("div"))` and appended to the layer imperatively (React never reconciles it, so the API replacing it with an iframe cannot break re-renders).
- **Start gating:** a single 3s `setTimeout` flips `timerDone`; an `IntersectionObserver` (threshold 0.15) tracks visibility; `document.visibilityState` gates on tab focus; `prefers-reduced-motion` skips autoplay entirely. `maybeStart()` runs whenever any of these become true.
- **Pause/resume:** visibilitychange + intersection fire `playVideo()`/`pauseVideo()` on the existing player.
- **Unmute:** clicking the hero background toggles sound via the video layer's click handler; a transparent `.hero-trailer-click-catcher` sits above the iframe so clicks are not swallowed by the iframe. A persistent mute toggle button (shadcn `Button` + lucide `Volume2`/`VolumeX`) is rendered by `DetailHero` at the hero root (bottom-right, `z-30` — above the content strip) and drives the player through a forwarded ref (`HeroTrailerHandle.toggleSound`). It only appears once the player reports ready via `onReadyChange`.
- **Errors:** player `onError` or API load failure → `failed` state → component returns `null`; the backdrop image underneath remains visible.
- **Cleanup:** `player.destroy()`, disconnect observer, remove listeners, remove mount element.

### `src/components/detail-hero.tsx` changes

- Render `{trailerUrl && <HeroTrailerBackground ref={trailerRef} url={trailerUrl} onReadyChange={setTrailerReady} onSoundChange={setTrailerSoundOn} />}` between the backdrop `ShimmerImage` and the gradient overlays.
- Render the mute toggle shadcn `Button` at the hero root (sibling of the content strip, `z-30` bottom-right) so it is never occluded by the content strip (`z-10`).
- New z-order inside the hero:
  1. backdrop `ShimmerImage` (z-0)
  2. `.hero-trailer-layer` (z-1)
  3. gradient overlays — now `pointer-events-none` so clicks reach the video layer (z-[2] implied by DOM order)
  4. content / BackButton / thumbnail (existing z-10/20/30)
- Backdrop image is kept mounted beneath the video (no flash; automatic fallback if the video fails). Thumbnail poster + hover-play trailer dialog unchanged.

### `src/components/hero-trailer-background.css`

- `.hero-trailer-layer` — `absolute inset-0 z-index:1 overflow:hidden cursor:pointer`.
- `.hero-trailer-layer iframe` — object-cover scaling via viewport units:
  `width:100vw; min-width:calc(100vh * 16/9); height:56.25vw; min-height:100vh;` centered with `translate(-50%,-50%)`. This keeps the 16:9 video filling any hero size (mobile portrait → desktop wide).
- `.hero-trailer-click-catcher` — `absolute inset-0 z-index:2`.
- `.hero-unmute-hint` — pill, `z-index:3`, `pointer-events:none`, fade-in/out keyframe.
- The persistent mute toggle uses the shared shadcn `Button` (`variant="ghost" size="icon-lg"` + overlay classes); no custom button CSS.

## Edge cases

- **No trailer** (`trailerUrl` null): nothing renders; static backdrop only.
- **Non-YouTube trailer URL:** skipped for background; dialog still attempts it (existing behavior).
- **Reduced motion:** autoplay disabled.
- **Scrolled away / tab hidden:** video pauses; resumes when back in view.
- **API/network failure:** falls back to the static image silently (logged via `logger`).
- **Mobile iOS:** `playsinline:1` + muted; if play is blocked, `onError`/no-op leaves the image.

## Out of scope

- No changes to the trailer dialog, thumbnail hover-play, or any API/data layer.
- No new dependencies.