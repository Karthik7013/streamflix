"use client"

import { MediaController } from "media-chrome/react"
import { ChevronLeft, Info } from "lucide-react"

import { usePlayerState } from "./use-player-state"
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
  const {
    containerRef,
    videoRef,
    barRef,
    playing,
    setPlaying,
    paused,
    setPaused,
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
    shortcuts,
    setShortcuts,
    skipIntro,
    setSkipIntro,
    countdown,
    setCountdown,
    loading,
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
    handleTouchEnd,
  } = usePlayerState({ onSkipIntro, nextEpisode, metadata })

  useKeyboardShortcuts({
    containerRef,
    videoRef,
    resetIdle,
    togglePlay,
    setMuted,
    setVol,
    setShortcuts,
    vol,
    dur,
  })

  return (
    <>
      <div
        ref={containerRef}
        className={`np-root relative overflow-hidden ${className ?? ""} ${idle ? "cursor-none" : "cursor-default"}`}
        style={{
          fontFamily: "'DM Sans', sans-serif",
          background: "var(--np-bg)",
        }}
        onMouseMove={resetIdle}
        onMouseLeave={() => {
          if (playing) setIdle(true)
        }}
        onTouchStart={resetIdle}
        onTouchEnd={handleTouchEnd}
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

        {loading && (
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
            ref={videoRef}
            slot="media"
            src={src}
            poster={poster}
            className="size-full object-contain cursor-pointer"
            onClick={togglePlay}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setProg((videoRef.current.currentTime / (dur || 1)) * 100)
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) setDur(videoRef.current.duration)
            }}
            onProgress={() => {
              if (videoRef.current && videoRef.current.buffered.length > 0) {
                setBuf(
                  (videoRef.current.buffered.end(
                    videoRef.current.buffered.length - 1,
                  ) /
                    (dur || 1)) *
                    100,
                )
              }
            }}
            onPlay={() => {
              setPlaying(true)
              setPaused(false)
            }}
            onPause={() => {
              setPlaying(false)
              setPaused(true)
            }}
            playsInline
          />

          <PauseOverlay
            paused={paused}
            title={title}
            poster={poster}
            metadata={metadata}
            togglePlay={togglePlay}
          />

          {skipIntro && onSkipIntro && !idle && (
            <SkipIntroButton
              onClick={() => {
                setSkipIntro(false)
                onSkipIntro?.()
              }}
            />
          )}

          {countdown !== null && nextEpisode && !idle && (
            <NextEpisodeCard
              nextEpisode={nextEpisode}
              countdown={countdown}
              ringOffset={ringOffset}
              R={R}
              C={C}
              onCancel={() => setCountdown(null)}
            />
          )}

          <div
            className={`np-top absolute top-0 left-0 right-0 z-10 px-9 max-sm:px-3 py-[18px] max-sm:py-2 flex items-center justify-between transition-all duration-400 ${idle ? "opacity-0 translate-y-[-7px] pointer-events-none" : ""}`}
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
            className={`np-ctrl absolute bottom-0 left-0 right-0 z-10 px-[30px] max-sm:px-2 pb-5 max-sm:pb-2 transition-all duration-400 ${idle ? "opacity-0 translate-y-[10px] pointer-events-none" : ""}`}
            style={{
              background: "linear-gradient(to top, color-mix(in srgb, var(--np-bg) 98%, transparent) 0%, color-mix(in srgb, var(--np-bg) 55%, transparent) 65%, transparent 100%)",
            }}
          >
            <PlayerControls
              barRef={barRef}
              dur={dur}
              prog={prog}
              buf={buf}
              hov={hov}
              hovX={hovX}
              curSec={curSec}
              totalSec={totalSec}
              hasChapters={hasChapters}
              chapters={metadata?.chapters}
              showVol={showVol}
              videoRef={videoRef}
              nextEpisode={nextEpisode}
              episodeSelector={episodeSelector}
              title={title}
              metadata={metadata}
              seekTo={seekTo}
              onHover={onHover}
              setHov={setHov}
              setShowVol={setShowVol}
              setCountdown={setCountdown}
              setShortcuts={setShortcuts}
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
