"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PlayerTopBar({
  title,
  year,
  idle,
  onBack,
}: {
  title: string
  year?: number | string
  idle: boolean
  onBack?: () => void
}) {
  return (
    <div
      className={`np-top-bar ${idle ? "" : "visible"}`}
    >
      {onBack && (
        <Button className="rounded-full" variant="ghost" size="icon-lg" onClick={onBack}>
          <ChevronLeft />
        </Button>
      )}
      <div
        className="np-player-title np-top-title absolute left-1/2 -translate-x-1/2 text-xl max-sm:text-sm text-foreground whitespace-nowrap"
      >
        {title}
        {year ? ` · ${year}` : ""}
      </div>
    </div>
  )
}
