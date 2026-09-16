"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { logger } from "@/lib/logger"


export function useVideoEngine(options?: { movieId?: number; episodeId?: number; userId?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedProgressRef = useRef<number>(0)
  const { movieId, episodeId, userId } = options || {}

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(75)
  const [muted, setMutedState] = useState(false)

  const saveProgress = useCallback(async (currentTime: number, duration: number) => {
    if (!userId || (!movieId && !episodeId) || duration <= 0) return
    if (Math.abs(currentTime - lastSavedProgressRef.current) < 5) return

    try {
      const res = await fetch("/api/watch-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieId,
          episodeId,
          progressSeconds: Math.floor(currentTime),
          durationSeconds: Math.floor(duration),
        }),
      })
      if (res.ok) {
        lastSavedProgressRef.current = currentTime
      }
    } catch (err) {
      logger.error("video-engine", "Failed to save progress", err)
    }
  }, [userId, movieId, episodeId])

  const scheduleSave = useCallback((currentTime: number, duration: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveProgress(currentTime, duration), 5000)
  }, [saveProgress])

  useEffect(() => {
    const handleUnload = () => {
      const video = videoRef.current
      if (video && duration > 0) {
        saveProgress(video.currentTime, duration)
      }
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => {
      window.removeEventListener("beforeunload", handleUnload)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [duration, saveProgress])

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m)
    if (videoRef.current) videoRef.current.muted = m
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const onVolumeChange = () => {
      setMutedState(el.muted)
      setVolumeState(Math.round(el.volume * 100))
    }
    el.addEventListener("volumechange", onVolumeChange)
    return () => el.removeEventListener("volumechange", onVolumeChange)
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      const promise = video.play()
      if (promise) {
        promise.catch((err) => {
          logger.error("video-engine", "Play failed", err)
        })
      }
    } else {
      video.pause()
    }
  }, [])

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>, bar: HTMLDivElement) => {
    if (!videoRef.current || !duration) return
    const r = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))
    videoRef.current.currentTime = (pct / 100) * duration
    setProgress(pct)
  }, [duration])

  const seekRelative = useCallback((delta: number) => {
    const video = videoRef.current
    if (video) video.currentTime = Math.max(0, Math.min(video.currentTime + delta, duration))
  }, [duration])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (videoRef.current) {
      videoRef.current.volume = v / 100
    }
  }, [])

  const changeVolume = useCallback((delta: number) => {
    const video = videoRef.current
    if (video) video.volume = Math.max(0, Math.min(video.volume + delta, 1))
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (video && duration) {
      const pct = (video.currentTime / duration) * 100
      setProgress(pct)
      scheduleSave(video.currentTime, duration)
    }
  }, [duration, scheduleSave])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (video) {
      setDuration(video.duration)
      if (userId && (movieId || episodeId) && video.currentTime > 0) {
        scheduleSave(video.currentTime, video.duration)
      }
    }
  }, [userId, movieId, episodeId, scheduleSave])

  const handleDurationChange = useCallback(() => {
    const video = videoRef.current
    if (video) setDuration(video.duration)
  }, [])

  const handleProgress = useCallback(() => {
    const video = videoRef.current
    if (video && video.buffered.length > 0 && duration) {
      setBuffered((video.buffered.end(video.buffered.length - 1) / duration) * 100)
    }
  }, [duration])

  const handleWaiting = useCallback(() => setLoading(true), [])
  const handlePlaying = useCallback(() => setLoading(false), [])
  const handleSeeking = useCallback(() => setLoading(true), [])
  const handleSeeked = useCallback(() => setLoading(false), [])

  const handleError = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    const code = el.error?.code
    const messages: Record<number, string> = {
      1: "Video loading aborted.",
      2: "A network error occurred. Check your connection.",
      3: "Video playback failed. The format may not be supported.",
      4: "Video could not be played. The source may be broken.",
    }
    setError(messages[code ?? 0] ?? "An unexpected error occurred.")
  }, [])

  const retry = useCallback(() => {
    setError(null)
    const el = videoRef.current
    if (!el) return
    el.load()
  }, [])

  return useMemo(() => ({
    videoRef,
    playing,
    progress,
    duration,
    buffered,
    loading,
    error,
    volume,
    muted,
    setVolume,
    setMuted,
    togglePlay,
    seekTo,
    seekRelative,
    changeVolume,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleDurationChange,
    handleProgress,
    handlePlay: () => setPlaying(true),
    handlePause: () => setPlaying(false),
    handleWaiting,
    handlePlaying,
    handleSeeking,
    handleSeeked,
    handleError,
    retry,
    seekToSavedProgress: (time: number) => {
      const video = videoRef.current
      if (video) {
        video.currentTime = time
        setProgress((time / duration) * 100)
      }
    },
  }), [playing, progress, duration, buffered, loading, error, volume, muted, setVolume, setMuted, togglePlay, seekTo, seekRelative, changeVolume, handleTimeUpdate, handleLoadedMetadata, handleDurationChange, handleProgress, handleWaiting, handlePlaying, handleSeeking, handleSeeked, handleError, retry])
}
