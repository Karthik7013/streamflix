# Framer Motion Animations

**Date:** 2026-06-10
**Intensity:** 4-5/10 (polished, not showy)

## Goal

Add subtle, tasteful framer-motion animations throughout the app to improve perceived polish and UX without distracting from content.

## Scope

All pages and major interactive components. Shared animation primitives to keep motion consistent.

---

## 1. Shared Primitives

### `src/lib/motion.ts` — Reusable variants

```ts
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
}

export const stagger = {
  animate: { transition: { staggerChildren: 0.05 } },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
}
```

### `src/components/motion-div.tsx` — Thin `motion.div` wrapper

A `<MotionDiv>` component that wraps `motion.div` with configurable variants and `whileInView` support. Used across all consumer pages.

---

## 2. Page-Level Animations

### Landing page (`page.tsx`)
- **Poster grid:** stagger the 120 poster cards with `whileInView` — each fades up with 0.02s delay increments
- **Content section:** fade-up on scroll with `whileInView={{ once: true }}`
- **Button:** subtle `whileHover={{ scale: 1.02 }}` + `whileTap={{ scale: 0.98 }}`

### Login page
- **Login card:** `scaleIn` on mount (fade + subtle scale)
- **Form fields:** stagger children fade-up
- **OAuth buttons:** `whileHover={{ scale: 1.01 }}`, `whileTap={{ scale: 0.98 }}`
- **Toggle link (sign in/up):** layout animation on text swap
- **Back link:** existing translate, keep as-is

### Forgot password
- **Card:** same `scaleIn` as login
- **Form/success state:** `AnimatePresence` to cross-fade between states

### 404 page
- **404 text:** `fadeUp` on mount

---

## 3. Consumer Pages (Home, Explore, Favorites, Settings)

### Home content (`home-content.tsx`)
- **Section headings:** `fadeIn` on scroll
- **Movie card rows:** `stagger` container → each card `fadeUp`
- **"Continue Watching" / "Recently Added":** stagger on mount

### Explore content (`explore-content.tsx`)
- **Search input:** minimal — no animation on input
- **Tag filters:** `layout` prop for smooth repositioning on filter toggle
- **Movie grid:** `stagger` → each `MovieCard` fades up on mount
- **Load-more skeleton:** existing skeleton, no change

### Favorites content (`favorites-content.tsx`)
- **Movie grid:** same stagger + fadeUp as explore
- **Empty state:** `fadeUp` on the heart icon + text

### Settings content (`settings-content.tsx`)
- **Profile card:** first card fades in
- **Remaining cards:** stagger children fade-up
- **Modal/dialogs:** existing Dialog transition, no change needed

### Movie detail (`movie-detail-content.tsx`)
- **Back button:** keep existing, no change
- **Thumbnail:** `scaleIn` with a slower duration (0.4s)
- **Title + metadata + description:** stagger children fade-up
- **Progress bar:** keep existing CSS transition
- **Favorite toggle:** `whileTap={{ scale: 0.85 }}` for heart icon

---

## 4. Admin Pages

### Admin dashboard (`admin/page.tsx`)
- **Stat cards:** stagger container → each card fades up with `whileInView`
- **Tables (Recent Signups, Most Favorited):** fade-in on mount

### Admin movies/tags/featured/users
- **Table rows:** stagger fade-up on mount (after data loads)
- **Search/filter:** no animation
- **Dialog opens:** existing Dialog transition is sufficient
- **Inline edit (tags):** keep existing, no change

### Admin layout
- **Sidebar collapse:** keep existing CSS transition (works well)
- **Mode toggle:** no animation needed

---

## 5. Shared Interactive Components

### Hero carousel
- **Slide transition:** `AnimatePresence` with `mode="wait"` — next slide fades in + slides up slightly
- **Dot indicators:** keep existing CSS transition
- **Auto-play:** unchanged

### Movie card
- **Hover:** replace CSS `group-hover:scale-105` with framer `whileHover={{ scale: 1.05 }}` — smoother easing
- **Mount:** each card gets `fadeUp` when it enters the DOM

### Dialog / AlertDialog
- Keep existing CSS transitions — already sufficient at intensity 4-5

### Toggle buttons / switches
- `whileTap={{ scale: 0.95 }}` on all interactive buttons

---

## 6. Key Constraints

- **No page transitions** between routes — would require app-wide layout restructuring and is overkill for a content app at intensity 4-5
- **No heavy spring physics** — standard easing (0.2–0.4s duration)
- **`once: true`** on all `whileInView` — animations don't replay on scroll
- **Accessibility:** `prefers-reduced-motion` respected via framer's built-in support (`motion` respects `MotionConfig`)

---

## Files Changed

| File | Change |
|---|---|
| `package.json` | Add `framer-motion` dependency |
| `src/lib/motion.ts` | New file — shared variants |
| `src/components/motion-div.tsx` | New file — thin motion wrapper |
| `src/app/page.tsx` | Landing page animations |
| `src/app/(main)/home/home-content.tsx` | Stagger card sections |
| `src/app/(main)/explore/explore-content.tsx` | Stagger grid, layout on tags |
| `src/app/(main)/favorites/favorites-content.tsx` | Stagger grid, empty state |
| `src/app/(main)/settings/settings-content.tsx` | Card stagger |
| `src/app/movies/[slug]/movie-detail-content.tsx` | Image reveal, text stagger |
| `src/app/login/page.tsx` | Card entrance, field stagger |
| `src/app/forgot-password/page.tsx` | Card entrance, state transition |
| `src/app/not-found.tsx` | Text fade-up |
| `src/app/admin/page.tsx` | Stat card stagger |
| `src/app/admin/movies/page.tsx` | Row stagger |
| `src/app/admin/featured/page.tsx` | Row stagger |
| `src/app/admin/tags/page.tsx` | Row stagger |
| `src/app/admin/users/page.tsx` | Row stagger |
| `src/components/hero-carousel.tsx` | AnimatePresence slide |
| `src/components/movie-card.tsx` | whileHover + mount animation |
