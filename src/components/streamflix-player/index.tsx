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
  const barRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const video = useVideoEngine()
  const {
    videoRef,
    playing,
    progress,
    duration,
    buffered,
    muted,
    loading,
    error: videoError,
    togglePlay,
    setMuted,
    seekTo,
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
  } = video
  const ui = usePlayerUI(playing)
  const autoPlay = useAutoPlay(progress, nextEpisode)

  const seekRelative = useCallback((delta: number) => {
    const v = videoRef.current
    if (v) v.currentTime = Math.max(0, Math.min(v.currentTime + delta, duration))
  }, [videoRef, duration])

  const changeVolume = useCallback((delta: number) => {
    const v = videoRef.current
    if (v) v.volume = Math.max(0, Math.min(v.volume + delta, 1))
  }, [videoRef])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }, [])

  const actions = useMemo(() => ({
    togglePlay,
    toggleMuted: () => setMuted(!muted),
    seekRelative,
    changeVolume,
    toggleFullscreen,
    toggleShortcuts: () => ui.setShortcuts((v) => !v),
    closeShortcuts: () => ui.setShortcuts(false),
    resetIdle: ui.resetIdle,
  }), [togglePlay, setMuted, muted, seekRelative, changeVolume, toggleFullscreen, ui])

  useKeyboardShortcuts(actions)

  const onStartCountdown = useCallback(
    (s: number) => autoPlay.setCountdown(s),
    [autoPlay]
  );

  const videoObj = useMemo(
    () => ({ duration, progress, buffered, chapters: metadata?.chapters }),
    [duration, progress, buffered, metadata?.chapters]
  );

  const hoverObj = useMemo(
    () => ({ hover: ui.hov, hoverX: ui.hovX, setHover: ui.setHov }),
    [ui.hov, ui.hovX, ui.setHov]
  );

  const callbacksObj = useMemo(
    () => ({ seekTo, onHover: ui.onHover }),
    [seekTo, ui.onHover]
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`np-root np-container relative overflow-hidden ${className ?? ""} ${ui.idle ? "np-cursor-hidden" : ""}`}
        onMouseMove={ui.resetIdle}
        onMouseLeave={() => {
          if (playing) ui.setIdle(true)
        }}
        onTouchStart={ui.resetIdle}
        onTouchEnd={ui.handleTouchEnd}
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

        {videoError && (
          <div className="np-error-overlay">
            <div className="np-error-icon">!</div>
            <p className="np-error-text">{videoError}</p>
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

          {ui.skipIntro && onSkipIntro && !ui.idle && (
            <SkipIntroButton
              onClick={() => {
                ui.setSkipIntro(false)
                onSkipIntro?.()
              }}
            />
          )}

          {autoPlay.countdown !== null && nextEpisode && !ui.idle && (
            <NextEpisodeCard
              nextEpisode={nextEpisode}
              countdown={autoPlay.countdown}
              ringOffset={autoPlay.countdown !== null ? (2 * Math.PI * 18) - ((30 - autoPlay.countdown) / 30) * (2 * Math.PI * 18) : (2 * Math.PI * 18)}
              R={18}
              C={2 * Math.PI * 18}
              onCancel={() => autoPlay.setCountdown(null)}
            />
          )}

          <div
            className={`np-top-bar ${ui.idle ? "" : "visible"}`}
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
            className={`np-controls-bottom ${ui.idle ? "" : "visible"}`}
          >
            <PlayerControls
              barRef={barRef}
              videoRef={videoRef}
              video={videoObj}
              hover={hoverObj}
              callbacks={callbacksObj}
              showVol={ui.showVol}
              setShowVol={ui.setShowVol}
              nextEpisode={nextEpisode}
              onStartCountdown={onStartCountdown}
              episodeSelector={episodeSelector}
              title={title}
              metadata={metadata}
              setShortcuts={ui.setShortcuts}
            />
          </div>
        </MediaController>

        {ui.shortcuts && (
          <ShortcutsModal onClose={() => ui.setShortcuts(false)} />
        )}
      </div>
    </>
  )
}
