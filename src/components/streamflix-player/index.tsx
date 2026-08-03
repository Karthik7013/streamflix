"use client"

import { useCallback, useMemo, useRef } from "react"
import { MediaController } from "media-chrome/react"
import { ChevronLeft, Info, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

import { useVideoEngine } from "@/components/streamflix-player/use-video-engine"
import { usePlayerUI } from "@/components/streamflix-player/use-player-ui"
import { useAutoPlay } from "@/components/streamflix-player/use-auto-play"
import { useKeyboardShortcuts } from "@/components/streamflix-player/use-keyboard-shortcuts"
import { AmbientLayer } from "@/components/streamflix-player/ambient-layer"
import { SkipIntroButton } from "@/components/streamflix-player/skip-intro-button"
import { NextEpisodeCard } from "@/components/streamflix-player/next-episode-card"
import { PlayerControls } from "@/components/streamflix-player/player-controls"
import { ShortcutsModal } from "@/components/streamflix-player/shortcuts-modal"
import "@/components/streamflix-player/player.css"
import "@/components/streamflix-player/styles.css"

export interface EpisodeSelectorSeason {
  seasonNumber: number
  episodes: {
    episodeNumber: number
    title: string
    slug: string
    isActive: boolean
    href: string
  }[]
}

export interface NetflixPlayerProps {
  src: string
  poster?: string
  title: string
  metadata?: {
    year?: number | string
    duration?: string
    durationSeconds?: number
    rating?: string
    synopsis?: string
    cast?: string[]
    chapters?: number[]
  }
  onBack?: () => void
  onSkipIntro?: () => void
  nextEpisode?: {
    title: string
    thumbnail?: string
    onPlay: () => void
    countdownSeconds?: number
  }
  episodeSelector?: EpisodeSelectorSeason[]
  className?: string
}

export function StreamflixPlayer({
  src,
  poster,
  title,
  metadata,
  onBack,
  onSkipIntro,
  nextEpisode,
  episodeSelector,
  className,
}: NetflixPlayerProps) {
  const barRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const {
    videoRef,
    playing,
    progress,
    duration,
    buffered,
    loading,
    error,
    muted,
    setMuted,
    togglePlay,
    seekTo,
    seekRelative,
    changeVolume,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleDurationChange,
    handleProgress,
    handlePlay,
    handlePause,
    handleWaiting,
    handlePlaying,
    handleSeeking,
    handleSeeked,
    handleError,
    retry,
  } = useVideoEngine()
  const {
    idle,
    setIdle,
    skipIntro,
    setSkipIntro,
    showVol,
    setShowVol,
    shortcuts,
    setShortcuts,
    hov,
    hovX,
    setHov,
    onHover,
    resetIdle,
    handleTouchEnd,
  } = usePlayerUI(playing)
  const { countdown, setCountdown } = useAutoPlay(progress, nextEpisode)

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted(!muted)
  }, [muted, setMuted])

  const actions = useMemo(() => ({
    togglePlay,
    toggleMuted,
    seekRelative,
    changeVolume,
    toggleFullscreen,
    toggleShortcuts: () => setShortcuts((v) => !v),
    closeShortcuts: () => setShortcuts(false),
    resetIdle,
  }), [togglePlay, toggleMuted, seekRelative, changeVolume, toggleFullscreen, setShortcuts, resetIdle])

  useKeyboardShortcuts(actions)

  const onStartCountdown = useCallback(
    (s: number) => setCountdown(s),
    [setCountdown]
  )

  const handleSkipIntro = useCallback(() => {
    setSkipIntro(false)
    onSkipIntro?.()
  }, [setSkipIntro, onSkipIntro])

  const videoObj = useMemo(
    () => ({ duration, progress, buffered, chapters: metadata?.chapters }),
    [duration, progress, buffered, metadata?.chapters]
  )

  const hoverObj = useMemo(
    () => ({ hover: hov, hoverX: hovX, setHover: setHov }),
    [hov, hovX, setHov]
  )

  const callbacksObj = useMemo(
    () => ({ seekTo, onHover }),
    [seekTo, onHover]
  )

  return (
    <>
      <div
        ref={containerRef}
        className={`np-root np-container relative overflow-hidden ${className ?? ""} ${idle ? "np-cursor-hidden" : ""}`}
        onMouseMove={resetIdle}
        onMouseLeave={() => {
          if (playing) setIdle(true)
        }}
        onTouchStart={resetIdle}
        onTouchEnd={handleTouchEnd}
      >
        <AmbientLayer />

        <div className="np-letterbox-top" />
        <div className="np-letterbox-bottom" />

        <div className="np-gradient-top" />

        {loading && (
          <div className="np-loading-container">
            <div className="np-spinner" />
          </div>
        )}

        {error && (
          <div className="np-error-overlay">
            <div className="np-error-icon">!</div>
            <p className="np-error-text">{error}</p>
            <button className="np-error-retry" onClick={retry}>
              <RefreshCw className="size-4" />
              Try again
            </button>
          </div>
        )}

        <MediaController className="absolute inset-0 z-4 np-media-controller">
          <video
            ref={videoRef}
            slot="media"
            src={src}
            poster={poster}
            className="size-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onDurationChange={handleDurationChange}
            onProgress={handleProgress}
            onPlay={handlePlay}
            onPause={handlePause}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onSeeking={handleSeeking}
            onSeeked={handleSeeked}
            onError={handleError}
            playsInline
          />

          {skipIntro && onSkipIntro && !idle && (
            <SkipIntroButton onClick={handleSkipIntro} />
          )}

          {countdown !== null && nextEpisode && !idle && (
            <NextEpisodeCard
              nextEpisode={nextEpisode}
              countdown={countdown}
              ringOffset={(2 * Math.PI * 18) - ((30 - countdown) / 30) * (2 * Math.PI * 18)}
              R={18}
              C={2 * Math.PI * 18}
              onCancel={() => setCountdown(null)}
            />
          )}

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
              {metadata?.year ? ` · ${metadata.year}` : ""}
            </div>
            <div className="np-cast flex items-center gap-[9px] max-sm:hidden">
              {metadata?.cast?.slice(0, 3).map((n) => (
                <div
                  key={n}
                  className="np-cast-avatar w-[32px] h-[32px] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 cursor-default"
                  title={n}
                >
                  {n[0]}
                </div>
              ))}
              <button className="np-info-btn w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer">
                <Info size={13} />
              </button>
            </div>
          </div>

          <div className="np-gradient-bottom" />
          <div
            className={`np-controls-bottom ${idle ? "" : "visible"}`}
          >
            <PlayerControls
              barRef={barRef}
              videoRef={videoRef}
              video={videoObj}
              hover={hoverObj}
              callbacks={callbacksObj}
              showVol={showVol}
              setShowVol={setShowVol}
              nextEpisode={nextEpisode}
              onStartCountdown={onStartCountdown}
              episodeSelector={episodeSelector}
              title={title}
              metadata={metadata}
            />
          </div>
        </MediaController>

        {shortcuts && (
          <ShortcutsModal onClose={() => setShortcuts(false)} />
        )}
      </div>
    </>
  )
}
