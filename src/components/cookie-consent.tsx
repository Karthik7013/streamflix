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
