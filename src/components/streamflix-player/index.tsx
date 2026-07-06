"use client"

import { useCallback, useMemo, useRef } from "react"
import { MediaController } from "media-chrome/react"
import { ChevronLeft, Info } from "lucide-react"

import { useVideoEngine } from "@/components/streamflix-player/use-video-engine"
import { usePlayerUI } from "@/components/streamflix-player/use-player-ui"
import { useAutoPlay } from "@/components/streamflix-player/use-auto-play"
import { useKeyboardShortcuts } from "@/components/streamflix-player/use-keyboard-shortcuts"
import { AmbientLayer } from "@/components/streamflix-player/ambient-layer"
import { PauseOverlay } from "@/components/streamflix-player/pause-overlay"
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
  const ui = usePlayerUI(video.playing)
  const autoPlay = useAutoPlay(video.progress, nextEpisode)

  const seekRelative = useCallback((delta: number) => {
    const v = video.videoRef.current
    if (v) v.currentTime = Math.max(0, Math.min(v.currentTime + delta, video.duration))
  }, [video.videoRef, video.duration])

  const changeVolume = useCallback((delta: number) => {
    const v = video.videoRef.current
    if (v) v.volume = Math.max(0, Math.min(v.volume + delta, 1))
  }, [video.videoRef])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }, [])

  const actions = useMemo(() => ({
    togglePlay: video.togglePlay,
    toggleMuted: () => video.setMuted(!video.muted),
    seekRelative,
    changeVolume,
    toggleFullscreen,
    toggleShortcuts: () => ui.setShortcuts((v) => !v),
    closeShortcuts: () => ui.setShortcuts(false),
    resetIdle: ui.resetIdle,
  }), [video.togglePlay, video.setMuted, video.muted, seekRelative, changeVolume, toggleFullscreen, ui.setShortcuts, ui.resetIdle])

  useKeyboardShortcuts(actions)

  const totalSec = metadata?.durationSeconds || video.duration
  const curSec = (video.progress / 100) * totalSec

  return (
    <>
      <div
        ref={containerRef}
        className={`np-root np-container relative overflow-hidden ${className ?? ""} ${ui.idle ? "np-cursor-hidden" : ""}`}
        onMouseMove={ui.resetIdle}
        onMouseLeave={() => {
          if (video.playing) ui.setIdle(true)
        }}
        onTouchStart={ui.resetIdle}
        onTouchEnd={ui.handleTouchEnd}
      >
        <AmbientLayer />

        <div className="np-letterbox-top" />
        <div className="np-letterbox-bottom" />

        <div className="np-gradient-top" />

        {video.loading && (
          <div className="np-loading-container">
            <div className="np-spinner" />
          </div>
        )}

        <MediaController className="absolute inset-0 z-4 np-media-controller">
          <video
            ref={video.videoRef}
            slot="media"
            src={src}
            poster={poster}
            className="size-full object-contain cursor-pointer"
            onClick={video.togglePlay}
            onTimeUpdate={video.handleTimeUpdate}
            onLoadedMetadata={video.handleLoadedMetadata}
            onDurationChange={video.handleDurationChange}
            onProgress={video.handleProgress}
            onPlay={video.handlePlay}
            onPause={video.handlePause}
            onWaiting={video.handleWaiting}
            onPlaying={video.handlePlaying}
            onSeeking={video.handleSeeking}
            onSeeked={video.handleSeeked}
            playsInline
          />

          <PauseOverlay
            paused={!video.playing}
            title={title}
            poster={poster}
            metadata={metadata}
            togglePlay={video.togglePlay}
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
              <button
                onClick={onBack}
                className="np-back-btn"
              >
                <ChevronLeft size={17} />
                <span className="max-sm:hidden">Back to Browse</span>
              </button>
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
              videoRef={video.videoRef}
              video={{ duration: video.duration, progress: video.progress, buffered: video.buffered, chapters: metadata?.chapters }}
              hover={{ hover: ui.hov, hoverX: ui.hovX, setHover: ui.setHov }}
              callbacks={{ seekTo: video.seekTo, onHover: ui.onHover }}
              showVol={ui.showVol}
              setShowVol={ui.setShowVol}
              nextEpisode={nextEpisode}
              onStartCountdown={(s) => autoPlay.setCountdown(s)}
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
