# Cookie Consent Banner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a simple, dismissible informational cookie consent banner to the app.

**Architecture:** A single `"use client"` component mounted in the root layout. On mount, checks `localStorage` for a `cookie-consent` flag. If absent, renders a fixed bottom bar with a "Got it" button that sets the flag and dismisses the bar.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, `tw-animate-css`

**Global Constraints:**
- Use existing shadcn/ui `Button` component for the dismiss action
- Follow existing dark theme (OKLCH color tokens, `bg-neutral-950`, `border-neutral-800`, `text-neutral-300`)
- Only essential cookies used; no opt-in mechanism needed
- Preference stored in `localStorage` key `cookie-consent`

---

### Task 1: Create CookieConsent Component

**Files:**
- Create: `src/components/cookie-consent.tsx`

**Interfaces:**
- Produces: `<CookieConsent />` — a client component with no props

- [ ] **Step 1: Write the component source**

Create `src/components/cookie-consent.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Cookie } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie-consent")
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 100)
        return () => clearTimeout(timer)
      }
    } catch {
      // localStorage unavailable (incognito, strict privacy mode)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem("cookie-consent", "true")
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-neutral-950 border-t border-neutral-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <Cookie className="size-4 shrink-0 text-emerald-400" />
            <span>
              We use essential cookies for authentication and to improve your
              experience.{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 hover:text-emerald-400 transition-colors"
              >
                Learn more
              </Link>
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={dismiss}
            className="shrink-0 border-emerald-800 text-emerald-400 hover:bg-emerald-950/50"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the component**

Run: `npx tsc --noEmit`
Expected: No type errors

### Task 2: Mount in Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `<CookieConsent />` from `@/components/cookie-consent`

- [ ] **Step 1: Add the import**

After the existing `SpeedInsights` import, insert:

```tsx
import { CookieConsent } from "@/components/cookie-consent"
```

- [ ] **Step 2: Add the component**

After the `</Providers>` closing tag (line 76), insert `<CookieConsent />`:

```tsx
        </Providers>
        <CookieConsent />
        <Analytics />
        <SpeedInsights />
```

- [ ] **Step 3: Verify the build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with no errors

