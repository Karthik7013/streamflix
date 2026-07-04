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
      if (e.key === " " || e.key === "k") {
        e.preventDefault()
        actions.togglePlay()
      }
      if (e.key === "m") actions.toggleMuted()
      if (e.key === "ArrowRight") {
        e.preventDefault()
        actions.seekRelative(10)
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        actions.seekRelative(-10)
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        actions.changeVolume(5)
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        actions.changeVolume(-5)
      }
      if (e.key === "f" || e.key === "F") actions.toggleFullscreen()
      if (e.key === "?") actions.toggleShortcuts()
      if (e.key === "Escape") actions.closeShortcuts()
    },
    [actions],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}
