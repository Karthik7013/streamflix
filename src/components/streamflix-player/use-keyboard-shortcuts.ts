"use client"

import { useEffect, useCallback } from "react"

interface KeyboardActions {
  togglePlay: () => void
  toggleMuted: () => void
  seekRelative: (delta: number) => void
  changeVolume: (delta: number) => void
  toggleFullscreen: () => void
  toggleShortcuts: () => void
  closeShortcuts: () => void
  resetIdle: () => void
}

export function useKeyboardShortcuts(actions: KeyboardActions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      actions.resetIdle()
      const handled = new Set([" ", "k", "m", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "f", "F", "?", "Escape"])
      if (!handled.has(e.key)) return
      e.preventDefault()
      e.stopPropagation()
      if (e.key === " " || e.key === "k") actions.togglePlay()
      else if (e.key === "m") actions.toggleMuted()
      else if (e.key === "ArrowRight") actions.seekRelative(10)
      else if (e.key === "ArrowLeft") actions.seekRelative(-10)
      else if (e.key === "ArrowUp") actions.changeVolume(5)
      else if (e.key === "ArrowDown") actions.changeVolume(-5)
      else if (e.key === "f" || e.key === "F") actions.toggleFullscreen()
      else if (e.key === "?") actions.toggleShortcuts()
      else if (e.key === "Escape") actions.closeShortcuts()
    },
    [actions],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [handleKeyDown])
}
