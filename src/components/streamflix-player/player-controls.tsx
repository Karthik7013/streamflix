"use client"

import {
  MediaPlayButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaFullscreenButton,
} from "media-chrome/react"
import {
  SkipForward,
  LayoutGrid,
  Keyboard,
  Film,
} from "lucide-react"
import { Forward10, Replay10 } from "@/components/streamflix-player/icons"
import { fmt } from "@/lib/player-utils"
import Link from "next/link"
import { useState, useRef, useEffect, memo } from "react"

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

export const PlayerControls = memo(function PlayerControls({
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
  const totalSec = duration
  const hasChapters = !!(chapters && chapters.length > 0)

  return (
    <>
      <div
        ref={barRef}
        className="np-progress-wrap mb-[9px]"
        onClick={(e) => barRef.current && totalSec > 0 && seekTo(e, barRef.current)}
        onMouseMove={(e) => barRef.current && totalSec > 0 && onHover(e, barRef.current)}
        onMouseLeave={() => setHov(null)}
      >
        {hov !== null && totalSec > 0 && (
          <div
            className="np-hover-preview max-sm:hidden"
            style={{ left: `${hovX}px` }}
          >
            {fmt((hov / 100) * totalSec)}
          </div>
        )}
        <div className="np-progress-track">
          <div
            className="np-progress-buffer"
            style={{ width: `${buffered}%` }}
          />
          <div
            className="np-progress-fill"
            style={{ width: `${progress}%` }}
          />
          {hasChapters &&
            chapters?.map((p, i) => (
              <div
                key={i}
                className="np-chapter-marker"
                style={{ left: `${p}%` }}
              />
            ))}
          <div
            className="np-progress-thumb"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <div className="np-controls-row">
        <div className="np-controls-left">
          <button
            className="mp-btn max-sm:hidden"
            onClick={() => {
              if (videoRef.current)
                videoRef.current.currentTime = Math.max(0, ((progress - 0.9) / 100) * duration)
            }}
            title="Rewind 10s"
          >
            <Replay10 size={20} />
          </button>
          <MediaPlayButton
            className="np-media-play-btn w-[50px] max-sm:w-[38px] max-sm:h-[38px] h-[50px] rounded-full flex items-center justify-center cursor-pointer"
          />
          <button
            className="mp-btn max-sm:hidden"
            onClick={() => {
              if (videoRef.current)
                videoRef.current.currentTime = Math.min(duration, ((progress + 0.9) / 100) * duration)
            }}
            title="Forward 10s"
          >
            <Forward10 size={20} />
          </button>
          <div
            className="flex items-center gap-[3px] max-sm:hidden"
            onMouseEnter={() => setShowVol(true)}
            onMouseLeave={() => setShowVol(false)}
          >
            <MediaMuteButton className="mp-btn np-media-mute-btn" />
            <div
              className={`overflow-hidden opacity-0 flex items-center transition-all duration-320 ${showVol ? "max-w-[84px] opacity-100" : "max-w-0"}`}
            >
              <MediaVolumeRange
                className="np-media-volume w-[76px] h-[4px] rounded-[4px] outline-none cursor-pointer ml-[3px]"
              />
            </div>
          </div>
          <div className="np-time">
            {fmt((progress / 100) * duration)}{" "}
            <em className="np-time-sep">/</em>{" "}
            {metadata?.duration || fmt(duration)}
          </div>
        </div>
        <div className="np-center-title text-[11.5px] font-medium uppercase max-sm:hidden">
          {title}
        </div>
        <div className="flex items-center gap-[3px] max-sm:gap-[2px]">

          {episodeSelector ? <EpisodeDropdown seasons={episodeSelector} /> : (
            <button className="mp-rbtn max-sm:hidden" title="Episodes">
              <LayoutGrid size={16} />
            </button>
          )}
          {nextEpisode && (
            <button
              className="np-next-ep-btn flex items-center gap-[5px] max-sm:gap-1 px-[13px] max-sm:px-2 py-[5px] text-[12px] max-sm:text-[10px] font-semibold text-foreground cursor-pointer rounded-[18px] whitespace-nowrap"
              onClick={() => onStartCountdown(nextEpisode.countdownSeconds ?? 30)}
            >
              <SkipForward size={12} /> Next
            </button>
          )}

          <button
            className="mp-rbtn max-sm:hidden"
            title="Keyboard Shortcuts (?)"
            onClick={() => setShortcuts(true)}
          >
            <Keyboard size={16} />
          </button>
          <MediaFullscreenButton className="mp-rbtn np-media-fs-btn" />
        </div>
      </div>
    </>
  );
})

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
        <div className="np-episode-dropdown">
          {seasons.map((season) => (
            <div key={season.seasonNumber}>
              <div className="np-season-header px-2 py-1.5 text-xs font-semibold uppercase tracking-wider">
                Season {season.seasonNumber}
              </div>
              {season.episodes.map((ep) => (
                <Link
                  key={ep.slug}
                  href={ep.href}
                  onClick={() => setOpen(false)}
                  className={`np-episode-item ${ep.isActive ? "active" : ""}`}
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
