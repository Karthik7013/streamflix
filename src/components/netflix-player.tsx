"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronLeft, SkipBack, SkipForward } from "lucide-react"

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface NetflixPlayerProps {
  src: string
  poster?: string
  title?: string
  onBack?: () => void
  className?: string
}

export function NetflixPlayer({ src, poster, title, onBack, className }: NetflixPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [paused, setPaused] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [uiVisible, setUiVisible] = useState(true)

  const showTemporarily = useCallback(() => {
    setUiVisible(true)
    clearTimeout(hideTimerRef.current)
    if (!paused) {
      hideTimerRef.current = setTimeout(() => setUiVisible(false), 3000)
    }
  }, [paused])

  useEffect(() => {
    showTemporarily()
    return () => clearTimeout(hideTimerRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    el.addEventListener("fullscreenchange", onChange)
    return () => el.removeEventListener("fullscreenchange", onChange)
  }, [])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setPaused(false)
    } else {
      videoRef.current.pause()
      setPaused(true)
    }
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    videoRef.current.currentTime = pos * duration
  }, [duration])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (videoRef.current) {
      videoRef.current.volume = val
      setMuted(val === 0)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case " ": {
        e.preventDefault()
        togglePlay()
        break
      }
      case "ArrowLeft": {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10)
        }
        break
      }
      case "ArrowRight": {
        if (videoRef.current && duration) {
          videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10)
        }
        break
      }
      case "f":
      case "F": {
        toggleFullscreen()
        break
      }
      case "Escape": {
        setUiVisible(prev => !prev)
        break
      }
    }
  }, [togglePlay, toggleFullscreen, duration])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden ${className ?? ""}`}
      onMouseMove={showTemporarily}
      onTouchStart={showTemporarily}
      onMouseLeave={() => { if (!paused) setUiVisible(false) }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="size-full object-contain cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime) }}
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration) }}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        playsInline
      />

      {/* Center play button when paused */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${paused ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={togglePlay}
      >
        <div className="size-16 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center hover:bg-white/20 transition-colors">
          <Play className="size-8 text-white fill-white ml-1" />
        </div>
      </div>

      {/* Top gradient + back button */}
      <div
        className={`absolute top-0 left-0 right-0 z-10 transition-opacity duration-500 ${uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-linear-to-b from-black/80 via-black/40 to-transparent pt-4 pb-16 px-4">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <ChevronLeft className="size-5" />
              {title && <span className="text-sm font-medium">{title}</span>}
            </button>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transition-opacity duration-500 ${uiVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="bg-linear-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-4">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white/80 hover:text-white transition-colors shrink-0">
              {paused ? <Play className="size-5 fill-white" /> : <Pause className="size-5 fill-white" />}
            </button>

            <button
              onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 10) }}
              className="text-white/60 hover:text-white transition-colors shrink-0"
            >
              <SkipBack className="size-4" />
            </button>

            <button
              onClick={() => { if (videoRef.current && duration) videoRef.current.currentTime = Math.min(duration, currentTime + 10) }}
              className="text-white/60 hover:text-white transition-colors shrink-0"
            >
              <SkipForward className="size-4" />
            </button>

            {/* Progress bar */}
            <div
              className="flex-1 h-1 bg-white/20 rounded cursor-pointer group relative"
              onClick={handleProgressClick}
            >
              <div className="h-full bg-white rounded" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2" />
              </div>
            </div>

            <span className="text-white/60 text-xs tabular-nums whitespace-nowrap shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol shrink-0">
              <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 group-hover/vol:w-20 accent-white transition-all duration-300"
              />
            </div>

            <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors shrink-0">
              {fullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Thin progress strip at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 z-20 bg-white/20 pointer-events-none">
        <div className="h-full bg-red-600 transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
