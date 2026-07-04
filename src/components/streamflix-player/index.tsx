"use client"

import { useRef } from "react"
import { MediaController } from "media-chrome/react"
import { ChevronLeft, Info } from "lucide-react"

import { useVideoEngine } from "./use-video-engine"
import { usePlayerUI } from "./use-player-ui"
import { useAutoPlay } from "./use-auto-play"
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts"
import { AmbientLayer } from "./ambient-layer"
import { PauseOverlay } from "./pause-overlay"
import { SkipIntroButton } from "./skip-intro-button"
import { NextEpisodeCard } from "./next-episode-card"
import { PlayerControls } from "./player-controls"
import { ShortcutsModal } from "./shortcuts-modal"
import "./player.css"

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

  useKeyboardShortcuts({
    togglePlay: video.togglePlay,
    toggleMuted: () => video.setMuted(!video.muted),
    seekRelative: (delta) => {
      if (video.videoRef.current) {
        video.videoRef.current.currentTime = Math.max(0, Math.min(video.duration, video.videoRef.current.currentTime + delta))
      }
    },
    changeVolume: (delta) => {
      const nv = Math.max(0, Math.min(100, video.volume + delta))
      video.setVolume(nv)
    },
    toggleFullscreen: () => {
      if (containerRef.current) {
        if (document.fullscreenElement) document.exitFullscreen()
        else containerRef.current.requestFullscreen()
      }
    },
    toggleShortcuts: () => ui.setShortcuts((v) => !v),
    closeShortcuts: () => ui.setShortcuts(false),
    resetIdle: ui.resetIdle,
  })

  const totalSec = metadata?.durationSeconds || video.duration
  const curSec = (video.progress / 100) * totalSec

  return (
    <>
      <div
        ref={containerRef}
        className={`np-root relative overflow-hidden ${className ?? ""} ${ui.idle ? "cursor-none" : "cursor-default"}`}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "var(--np-bg)",
        }}
        onMouseMove={ui.resetIdle}
        onMouseLeave={() => {
          if (video.playing) ui.setIdle(true)
        }}
        onTouchStart={ui.resetIdle}
        onTouchEnd={ui.handleTouchEnd}
      >
        <AmbientLayer />

        <div
          className="absolute top-0 left-0 right-0 z-3 bg-background"
          style={{ height: "var(--lb)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 z-3 bg-background"
          style={{ height: "var(--lb)" }}
        />

        {video.loading && (
          <div
            className="absolute inset-0 z-9 flex items-center justify-center pointer-events-none"
            style={{ top: "var(--lb)", bottom: "var(--lb)" }}
          >
            <div
              className="w-[46px] h-[46px] rounded-full"
              style={{
                border: "3px solid color-mix(in srgb, var(--np-primary) 25%, transparent)",
                borderTopColor: "var(--np-primary)",
                animation: "spin 0.75s linear infinite",
                boxShadow: "0 0 26px color-mix(in srgb, var(--np-primary) 35%, transparent)",
              }}
            />
          </div>
        )}

        <MediaController
          className="absolute inset-0 z-4"
          style={{ top: "var(--lb)", bottom: "var(--lb)" } as React.CSSProperties}
        >
          <video
            ref={video.videoRef}
            slot="media"
            src={src}
            poster={poster}
            className="size-full object-contain cursor-pointer"
            onClick={video.togglePlay}
            onTimeUpdate={video.handleTimeUpdate}
            onLoadedMetadata={video.handleLoadedMetadata}
            onProgress={video.handleProgress}
            onPlay={video.handlePlay}
            onPause={video.handlePause}
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
            className={`np-top absolute top-0 left-0 right-0 z-10 px-9 max-sm:px-3 py-[18px] max-sm:py-2 flex items-center justify-between transition-all duration-400 ${ui.idle ? "opacity-0 translate-y-[-7px] pointer-events-none" : ""}`}
            style={{
              background: "linear-gradient(to bottom, color-mix(in srgb, var(--np-bg) 88%, transparent) 0%, transparent 100%)",
            }}
          >
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-[7px] bg-none border-none cursor-pointer text-[13px] font-medium"
                style={{
                  color: "color-mix(in srgb, var(--np-fg) 78%, transparent)",
                  letterSpacing: "0.06em",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <ChevronLeft size={17} />
                <span className="max-sm:hidden">Back to Browse</span>
              </button>
            )}
            <div
              className="np-top-title absolute left-1/2 -translate-x-1/2 text-xl max-sm:text-sm text-foreground whitespace-nowrap"
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontStyle: "italic",
                letterSpacing: "0.01em",
                textShadow: "0 2px 28px color-mix(in srgb, var(--np-bg) 95%, transparent)",
              }}
            >
              {title}
              {metadata?.year ? ` · ${metadata.year}` : ""}
            </div>
            <div className="np-cast flex items-center gap-[9px] max-sm:hidden">
              {metadata?.cast?.slice(0, 3).map((n) => (
                <div
                  key={n}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 cursor-default"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--np-primary) 70%, var(--np-bg)), var(--np-primary))",
                    border: "1.5px solid color-mix(in srgb, var(--np-fg) 16%, transparent)",
                    letterSpacing: "0.02em",
                  }}
                  title={n}
                >
                  {n[0]}
                </div>
              ))}
              <button
                className="w-[32px] h-[32px] rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  background: "color-mix(in srgb, var(--np-fg) 8%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--np-fg) 12%, transparent)",
                  color: "color-mix(in srgb, var(--np-fg) 65%, transparent)",
                }}
              >
                <Info size={13} />
              </button>
            </div>
          </div>

          <div
            className={`np-ctrl absolute bottom-0 left-0 right-0 z-10 px-[30px] max-sm:px-2 pb-5 max-sm:pb-2 transition-all duration-400 ${ui.idle ? "opacity-0 translate-y-[10px] pointer-events-none" : ""}`}
            style={{
              background: "linear-gradient(to top, color-mix(in srgb, var(--np-bg) 98%, transparent) 0%, color-mix(in srgb, var(--np-bg) 55%, transparent) 65%, transparent 100%)",
            }}
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
