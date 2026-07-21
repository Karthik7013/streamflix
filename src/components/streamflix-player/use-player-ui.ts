"use client"

import { useRef, useState, useCallback, useEffect } from "react"

export function usePlayerUI(playing: boolean) {
  const idleRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [idle, setIdle] = useState(false)
  const [shortcuts, setShortcuts] = useState(false)
  const [skipIntro, setSkipIntro] = useState(false)
  const [showVol, setShowVol] = useState(false)
  const [hov, setHov] = useState<number | null>(null)
  const [hovX, setHovX] = useState(0)

  const resetIdle = useCallback(() => {
    setIdle(false)
    clearTimeout(idleRef.current)
    if (playing) idleRef.current = setTimeout(() => setIdle(true), 3200)
  }, [playing])

  useEffect(() => {
    const id = setTimeout(() => resetIdle(), 0);
    return () => {
      clearTimeout(id);
      clearTimeout(idleRef.current);
    };
  }, [resetIdle])

  const handleTouchEnd = useCallback(() => {
    if (idle) resetIdle()
  }, [idle, resetIdle])

  const onHover = useCallback((e: React.MouseEvent<HTMLDivElement>, bar: HTMLDivElement) => {
    const r = bar.getBoundingClientRect()
    setHov(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)))
    setHovX(e.clientX - r.left)
  }, [])

  return {
    idle,
    setIdle,
    shortcuts,
    setShortcuts,
    skipIntro,
    setSkipIntro,
    showVol,
    setShowVol,
    hov,
    setHov,
    hovX,
    resetIdle,
    handleTouchEnd,
    onHover,
  }
}
