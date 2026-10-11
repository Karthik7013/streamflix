"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"

const IDLE_DELAY_MS = 3200

export function usePlayerUI(playing: boolean) {
  const [idleState, setIdleState] = useState(false)
  const [shortcuts, setShortcuts] = useState(false)
  const [showVol, setShowVol] = useState(false)
  const [hov, setHov] = useState<number | null>(null)
  const [hovX, setHovX] = useState(0)
  const playingRef = useRef(playing)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  const resetIdle = useCallback(() => {
    clearTimer()
    setIdleState(false)
    if (playingRef.current) {
      timerRef.current = setTimeout(() => setIdleState(true), IDLE_DELAY_MS)
    }
  }, [clearTimer])

  const setIdle = useCallback((v: boolean) => {
    clearTimer()
    setIdleState(v)
    if (!v && playingRef.current) {
      timerRef.current = setTimeout(() => setIdleState(true), IDLE_DELAY_MS)
    }
  }, [clearTimer])

  useEffect(() => {
    playingRef.current = playing
    clearTimer()
    if (playing) {
      timerRef.current = setTimeout(() => setIdleState(true), IDLE_DELAY_MS)
    }
    return clearTimer
  }, [playing, clearTimer])

  const idle = playing && idleState

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
