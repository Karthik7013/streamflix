# Cookie Consent Banner — Design Spec

## Purpose

Add a simple, dismissible informational cookie consent notice to the app, disclosing that only essential cookies are used (auth session, sidebar preference, Vercel Analytics). This aligns with the existing privacy policy (§5) which states: "We use essential cookies for authentication and session management."

## Scope

Single informational notice bar. No preference center, no opt-in/opt-out toggles. No database changes.

## Approach

**Simple client component in root layout** — a small sticky bar at the viewport bottom, shown once per visitor. Preference stored in `localStorage`.

## Design

### Layout
- Fixed bar at the bottom of the viewport (`fixed bottom-0 inset-x-0`)
- Full width with inner max-width constraint
- Z-index above all page content (`z-50`)
- Slides up on mount with a subtle animation
- Responsive: single row on desktop, stacks on mobile

### Visual style
- Dark surface matching the app's design system (`bg-neutral-950` with `border-t border-neutral-800`)
- Text: `text-sm text-neutral-300` with a subtle link to `/privacy`
- Button: ghost/outline style in emerald (`text-emerald-400 border-emerald-800 hover:bg-emerald-950/50`)
- Icon: optional small Lucide `Cookie` icon prefix

### Content
```
🍪 We use essential cookies for authentication and to improve your experience.
Read our [Privacy Policy](/privacy).
              [Got it]
```

### Behavior
- Checks `localStorage` key `cookie-consent` on mount
- If not found, renders the bar with a slide-up animation
- "Got it" button sets `localStorage.setItem('cookie-consent', 'true')` and bar slides down/removes
- Do NOT show the bar on subsequent visits
- Server-rendered layout passes the state check to client; no flash of content

## Files Changed

| File | Change |
|---|---|
| `src/components/cookie-consent.tsx` | **New** — Client component with banner UI + localStorage logic |
| `src/app/layout.tsx` | Add `<CookieConsent />` before the closing `</body>` |

## Non-Goals

- No GDPR/CCPA opt-in mechanism
- No cookie preference panel in settings
- No server-side cookie reading
- No third-party libraries

## Edge Cases

- **localStorage unavailable** (incognito, Safari): Component catches the error gracefully, bar does not show
- **SSR**: Component is a client boundary, localStorage check only runs after hydration
- **Analytics**: Vercel Analytics is already loaded in layout; the banner informs users of this
