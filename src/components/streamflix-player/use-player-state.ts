"use client"

import { useRef, useState, useEffect, useCallback } from "react"

export function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00"
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`
}

interface UsePlayerStateProps {
  onSkipIntro?: () => void
  nextEpisode?: {
    title: string
    onPlay: () => void
    countdownSeconds?: number
  }
  metadata?: {
    durationSeconds?: number
    chapters?: number[]
  }
}

export function usePlayerState({
  onSkipIntro,
  nextEpisode,
  metadata,
}: UsePlayerStateProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const idleRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const cntRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(true)
  const [muted, setMuted] = useState(false)
  const [vol, setVol] = useState(75)
  const [prog, setProg] = useState(0)
  const [buf, setBuf] = useState(0)
  const [dur, setDur] = useState(0)
  const [idle, setIdle] = useState(false)
  const [showVol, setShowVol] = useState(false)
  const [hov, setHov] = useState<number | null>(null)
  const [hovX, setHovX] = useState(0)
  const [shortcuts, setShortcuts] = useState(false)
  const [skipIntro, setSkipIntro] = useState(!!onSkipIntro)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const totalSec = metadata?.durationSeconds || dur
  const curSec = (prog / 100) * totalSec
  const R = 18
  const C = 2 * Math.PI * R
  const ringOffset = countdown !== null ? C - ((30 - countdown) / 30) * C : C
  const hasChapters = !!(metadata?.chapters && metadata.chapters.length > 0)

  const resetIdle = useCallback(() => {
    setIdle(false)
    clearTimeout(idleRef.current)
    if (playing) idleRef.current = setTimeout(() => setIdle(true), 3200)
  }, [playing])

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    resetIdle()
    return () => clearTimeout(idleRef.current)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  useEffect(() => {
    if (skipIntro && onSkipIntro) {
      const t = setTimeout(() => setSkipIntro(false), 9000)
      return () => clearTimeout(t)
    }
  }, [skipIntro, onSkipIntro])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (prog >= 93 && countdown === null && nextEpisode)
      setCountdown(nextEpisode.countdownSeconds ?? 30)
  }, [prog, countdown, nextEpisode])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      cntRef.current = setTimeout(
        () => setCountdown((c) => (c !== null ? c - 1 : null)),
        1000,
      )
    }
    if (countdown === 0 && nextEpisode) {
      nextEpisode.onPlay()
    }
    return () => clearTimeout(cntRef.current)
  }, [countdown, nextEpisode])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setPlaying(true)
      setPaused(false)
    } else {
      videoRef.current.pause()
      setPlaying(false)
      setPaused(true)
    }
  }, [])

  const seekTo = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!barRef.current || !videoRef.current || !dur) return
      const r = barRef.current.getBoundingClientRect()
      const pct = Math.max(
        0,
        Math.min(100, ((e.clientX - r.left) / r.width) * 100),
      )
      videoRef.current.currentTime = (pct / 100) * dur
      setProg(pct)
      setLoading(true)
      setTimeout(() => setLoading(false), 500)
    },
    [dur],
  )

  const onHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    const r = barRef.current.getBoundingClientRect()
    const p = Math.max(
      0,
      Math.min(100, ((e.clientX - r.left) / r.width) * 100),
    )
    setHov(p)
    setHovX(e.clientX - r.left)
  }, [])

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (idle && e.target === e.currentTarget) {
        resetIdle()
      }
    },
    [idle, resetIdle],
  )

  const handleTouchEnd = useCallback(() => {
    if (idle) resetIdle()
  }, [idle, resetIdle])

  return {
    containerRef,
    videoRef,
    barRef,
    idleRef,
    cntRef,
    playing,
    setPlaying,
    paused,
    setPaused,
    muted,
    setMuted,
    vol,
    setVol,
    prog,
    setProg,
    buf,
    setBuf,
    dur,
    setDur,
    idle,
    setIdle,
    showVol,
    setShowVol,
    hov,
    setHov,
    hovX,
    setHovX,
    shortcuts,
    setShortcuts,
    skipIntro,
    setSkipIntro,
    countdown,
    setCountdown,
    loading,
    setLoading,
    totalSec,
    curSec,
    R,
    C,
    ringOffset,
    hasChapters,
    resetIdle,
    togglePlay,
    seekTo,
    onHover,
    handleContainerClick,
    handleTouchEnd,
  }
}
