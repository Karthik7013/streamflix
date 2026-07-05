"use client"

import { useRef, useState, useCallback } from "react"

export function useVideoEngine() {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [loading, setLoading] = useState(false)
  const [volume, setVolumeState] = useState(75)
  const [muted, setMuted] = useState(false)

  const playPendingRef = useRef(false)

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (playPendingRef.current) return
    if (video.paused) {
      const promise = video.play()
      if (promise) {
        playPendingRef.current = true
        promise.finally(() => { playPendingRef.current = false })
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
    setLoading(true)
  }, [duration])

  const setVolume = useCallback((v: number) => {
    setVolumeState(v)
    if (videoRef.current) {
      videoRef.current.volume = v / 100
      if (v > 0) setMuted(false)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && duration) {
      setProgress((videoRef.current.currentTime / duration) * 100)
    }
  }, [duration])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }, [])

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) setDuration(videoRef.current.duration)
  }, [])

  const handleProgress = useCallback(() => {
    const v = videoRef.current
    if (v && v.buffered.length > 0 && duration) {
      setBuffered((v.buffered.end(v.buffered.length - 1) / duration) * 100)
    }
  }, [duration])

  const handleWaiting = useCallback(() => setLoading(true), [])
  const handlePlaying = useCallback(() => setLoading(false), [])
  const handleSeeking = useCallback(() => setLoading(true), [])
  const handleSeeked = useCallback(() => setLoading(false), [])

  return {
    videoRef,
    playing,
    progress,
    duration,
    buffered,
    loading,
    volume,
    muted,
    setVolume,
    setMuted,
    togglePlay,
    seekTo,
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
  }
}
