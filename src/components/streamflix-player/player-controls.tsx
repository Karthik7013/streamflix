"use client"

import {
  MediaPlayButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaFullscreenButton,
} from "media-chrome/react"
import {
  SkipBack,
  SkipForward,
  Subtitles,
  Settings,
  LayoutGrid,
  Keyboard,
  Film,
} from "lucide-react"
import { fmt } from "@/lib/player-utils"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"

interface EpisodeSelectorSeason {
  seasonNumber: number
  episodes: {
    episodeNumber: number
    title: string
    slug: string
    isActive: boolean
    href: string
  }[]
}

interface VideoData {
  duration: number
  progress: number
  buffered: number
  chapters?: number[]
}

interface HoverState {
  hover: number | null
  hoverX: number
  setHover: (v: number | null) => void
}

interface ControlsCallbacks {
  seekTo: (e: React.MouseEvent<HTMLDivElement>, bar: HTMLDivElement) => void
  onHover: (e: React.MouseEvent<HTMLDivElement>, bar: HTMLDivElement) => void
}

interface PlayerControlsProps {
  barRef: React.RefObject<HTMLDivElement | null>
  videoRef: React.RefObject<HTMLVideoElement | null>
  video: VideoData
  hover: HoverState
  callbacks: ControlsCallbacks
  showVol: boolean
  setShowVol: (v: boolean) => void
  nextEpisode?: {
    title: string
    onPlay: () => void
    countdownSeconds?: number
  }
  onStartCountdown: (seconds: number) => void
  episodeSelector?: EpisodeSelectorSeason[]
  title: string
  metadata?: { duration?: string }
  setShortcuts: (v: boolean) => void
}

export function PlayerControls({
  barRef,
  videoRef,
  video,
  hover,
  callbacks,
  showVol,
  setShowVol,
  nextEpisode,
  onStartCountdown,
  episodeSelector,
  title,
  metadata,
  setShortcuts,
}: PlayerControlsProps) {
  const { duration, progress, buffered, chapters } = video
  const { hover: hov, hoverX: hovX, setHover: setHov } = hover
  const { seekTo, onHover } = callbacks
  const curSec = (progress / 100) * (metadata?.duration ? 0 : duration)
  const totalSec = duration
  const hasChapters = !!(chapters && chapters.length > 0)

  return (
    <>
      <div
        ref={barRef}
        className="mp-prog-wrap relative cursor-pointer mb-[9px]"
        style={{ padding: "14px 0" }}
        onClick={(e) => barRef.current && seekTo(e, barRef.current)}
        onMouseMove={(e) => barRef.current && onHover(e, barRef.current)}
        onMouseLeave={() => setHov(null)}
      >
        {hov !== null && (
          <div
            className="absolute bottom-[32px] -translate-x-1/2 px-[9px] py-[4px] text-[11.5px] font-medium text-foreground whitespace-nowrap rounded-[5px] pointer-events-none z-20 max-sm:hidden"
            style={{
              left: `${hovX}px`,
              background: "color-mix(in srgb, var(--np-card) 95%, transparent)",
              border: "1px solid color-mix(in srgb, var(--np-primary) 35%, transparent)",
              backdropFilter: "blur(12px)",
              letterSpacing: "0.06em",
            }}
          >
            {fmt((hov / 100) * totalSec)}
          </div>
        )}
        <div
          className="mp-prog-track relative h-[4px] rounded-[4px]"
          style={{ background: "color-mix(in srgb, var(--np-fg) 17%, transparent)" }}
        >
          <div
            className="absolute top-0 left-0 h-full rounded-[4px]"
            style={{
              width: `${buffered}%`,
              background: "color-mix(in srgb, var(--np-fg) 26%, transparent)",
            }}
          />
          <div
            className="absolute top-0 left-0 h-full rounded-[4px]"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--np-primary) 80%, var(--np-bg)), var(--np-primary), color-mix(in srgb, var(--np-primary-glow) 80%, var(--np-bg)))",
            }}
          />
          {hasChapters &&
            chapters?.map((p, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full pointer-events-none"
                style={{
                  left: `${p}%`,
                  background: "color-mix(in srgb, var(--np-fg) 50%, transparent)",
                }}
              />
            ))}
          <div
            className="mp-knob absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[15px] h-[15px] bg-foreground rounded-full pointer-events-none"
            style={{
              left: `${progress}%`,
              transform: "translate(-50%, -50%) scale(0)",
              boxShadow:
                "0 0 14px color-mix(in srgb, var(--np-primary) 90%, transparent), 0 2px 8px color-mix(in srgb, var(--np-bg) 50%, transparent)",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-[5px] max-sm:gap-[3px]">
          <button
            className="mp-btn max-sm:hidden"
            onClick={() => {
              if (videoRef.current)
                videoRef.current.currentTime = Math.max(0, ((progress - 0.9) / 100) * duration)
            }}
            title="Rewind 10s"
          >
            <SkipBack size={20} />
          </button>
          <MediaPlayButton
            className="w-[50px] max-sm:w-[38px] max-sm:h-[38px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
            style={{
              border: "2px solid color-mix(in srgb, var(--np-primary) 44%, transparent)",
              background: "color-mix(in srgb, var(--np-primary) 13%, transparent)",
              "--media-primary-color": "var(--np-fg)",
              "--media-button-icon-width": "21px",
              "--media-button-icon-height": "21px",
              transition: "all 0.18s",
            } as React.CSSProperties}
          />
          <button
            className="mp-btn max-sm:hidden"
            onClick={() => {
              if (videoRef.current)
                videoRef.current.currentTime = Math.min(duration, ((progress + 0.9) / 100) * duration)
            }}
            title="Forward 10s"
          >
            <SkipForward size={20} />
          </button>
          <div
            className="flex items-center gap-[3px] max-sm:hidden"
            onMouseEnter={() => setShowVol(true)}
            onMouseLeave={() => setShowVol(false)}
          >
            <MediaMuteButton
              className="mp-btn"
              style={{
                "--media-primary-color": "color-mix(in srgb, var(--np-fg) 80%, transparent)",
                "--media-button-icon-width": "20px",
                "--media-button-icon-height": "20px",
              } as React.CSSProperties}
            />
            <div
              className={`overflow-hidden opacity-0 flex items-center transition-all duration-320 ${showVol ? "max-w-[84px] opacity-100" : "max-w-0"}`}
            >
              <MediaVolumeRange
                className="w-[76px] h-[4px] rounded-[4px] outline-none cursor-pointer ml-[3px]"
                style={{
                  "--media-primary-color": "var(--np-primary)",
                  "--media-range-track-background": "color-mix(in srgb, var(--np-fg) 25%, transparent)",
                } as React.CSSProperties}
              />
            </div>
          </div>
          <div
            className="text-[12.5px] max-sm:text-[10px] font-normal whitespace-nowrap ml-[4px]"
            style={{
              color: "color-mix(in srgb, var(--np-fg) 60%, transparent)",
              letterSpacing: "0.05em",
            }}
          >
            {fmt((progress / 100) * duration)}{" "}
            <em
              style={{
                color: "color-mix(in srgb, var(--np-fg) 30%, transparent)",
                fontStyle: "normal",
                margin: "0 3px",
              }}
            >
              /
            </em>{" "}
            {metadata?.duration || fmt(duration)}
          </div>
        </div>
        <div
          className="np-center-title text-[11.5px] font-medium uppercase max-sm:hidden"
          style={{
            color: "color-mix(in srgb, var(--np-fg) 38%, transparent)",
            letterSpacing: "0.15em",
          }}
        >
          {title}
        </div>
        <div className="flex items-center gap-[3px] max-sm:gap-[2px]">
          <button className="mp-rbtn max-sm:hidden" title="Subtitles">
            <Subtitles size={16} />
          </button>
          <button className="mp-rbtn max-sm:hidden" title="Audio Track">
            <span className="text-[11.5px] font-semibold" style={{ letterSpacing: "0.08em" }}>ENG</span>
          </button>
          {episodeSelector ? <EpisodeDropdown seasons={episodeSelector} /> : (
            <button className="mp-rbtn max-sm:hidden" title="Episodes">
              <LayoutGrid size={16} />
            </button>
          )}
          {nextEpisode && (
            <button
              className="flex items-center gap-[5px] max-sm:gap-1 px-[13px] max-sm:px-2 py-[5px] text-[12px] max-sm:text-[10px] font-semibold text-foreground cursor-pointer rounded-[18px] whitespace-nowrap"
              style={{
                background: "color-mix(in srgb, var(--np-primary) 11%, transparent)",
                border: "1px solid color-mix(in srgb, var(--np-primary) 36%, transparent)",
                letterSpacing: "0.06em",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onClick={() => onStartCountdown(nextEpisode.countdownSeconds ?? 30)}
            >
              <SkipForward size={12} /> Next
            </button>
          )}
          <button className="mp-rbtn max-sm:hidden" title="Settings">
            <Settings size={16} />
          </button>
          <button
            className="mp-rbtn max-sm:hidden"
            title="Keyboard Shortcuts (?)"
            onClick={() => setShortcuts(true)}
          >
            <Keyboard size={16} />
          </button>
          <MediaFullscreenButton
            className="mp-rbtn"
            style={{
              "--media-primary-color": "color-mix(in srgb, var(--np-fg) 62%, transparent)",
              "--media-button-icon-width": "16px",
              "--media-button-icon-height": "16px",
            } as React.CSSProperties}
          />
        </div>
      </div>
    </>
  )
}

function EpisodeDropdown({ seasons }: { seasons: EpisodeSelectorSeason[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative max-sm:hidden">
      <button className="mp-rbtn" title="Episodes" onClick={() => setOpen(!open)}>
        <LayoutGrid size={16} />
      </button>
      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 w-64 max-h-80 overflow-y-auto rounded-lg p-2 z-50"
          style={{
            background: "color-mix(in srgb, var(--np-card) 98%, transparent)",
            border: "1px solid color-mix(in srgb, var(--np-primary) 20%, transparent)",
            backdropFilter: "blur(16px)",
          }}
        >
          {seasons.map((season) => (
            <div key={season.seasonNumber}>
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "color-mix(in srgb, var(--np-fg) 50%, transparent)" }}>
                Season {season.seasonNumber}
              </div>
              {season.episodes.map((ep) => (
                <Link
                  key={ep.slug}
                  href={ep.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    ep.isActive ? "bg-primary/20 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <Film size={12} className="shrink-0" />
                  <span className="truncate">{ep.episodeNumber}. {ep.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
