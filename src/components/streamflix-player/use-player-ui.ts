"use client"

import { useState, useCallback, useEffect, useMemo } from "react"

const IDLE_DELAY_MS = 3200

export function usePlayerUI(playing: boolean) {
  const [activeAt, setActiveAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [shortcuts, setShortcuts] = useState(false)
  const [showVol, setShowVol] = useState(false)
  const [hov, setHov] = useState<number | null>(null)
  const [hovX, setHovX] = useState(0)

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [playing])

  const idle = playing && now - activeAt >= IDLE_DELAY_MS

  const resetIdle = useCallback(() => setActiveAt(Date.now()), [])
  const setIdle = useCallback((v: boolean) => setActiveAt(v ? 0 : Date.now()), [])

  const handleTouchEnd = useCallback(() => {
    if (idle) resetIdle()
  }, [idle, resetIdle])

  const onHover = useCallback((e: React.MouseEvent<HTMLDivElement>, bar: HTMLDivElement) => {
    const r = bar.getBoundingClientRect()
    setHov(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)))
    setHovX(e.clientX - r.left)
  }, [])

  return useMemo(() => ({
    idle,
    setIdle,
    shortcuts,
    setShortcuts,
    showVol,
    setShowVol,
    hov,
    setHov,
    hovX,
    resetIdle,
    handleTouchEnd,
    onHover,
  }), [idle, setIdle, shortcuts, showVol, hov, hovX, resetIdle, handleTouchEnd, onHover])
}
