"use client"

import {
  MediaPlayButton,
  MediaMuteButton,
  MediaVolumeRange,
  MediaFullscreenButton,
} from "media-chrome/react"
import { Forward10, Replay10 } from "@/components/streamflix-player/icons"
import { fmt } from "@/lib/player-utils"
import { memo } from "react"

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
  title: string
  metadata?: { duration?: string }
}

export const PlayerControls = memo(function PlayerControls({
  barRef,
  videoRef,
  video,
  hover,
  callbacks,
  showVol,
  setShowVol,
  title,
  metadata,
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
                key={`ch-${i}`}
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
              const v = videoRef.current
              if (v) v.currentTime = Math.max(0, v.currentTime - 10)
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
              const v = videoRef.current
              if (v) v.currentTime = Math.min(duration, v.currentTime + 10)
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

          <MediaFullscreenButton className="mp-rbtn np-media-fs-btn" />
        </div>
      </div>
    </>
  );
})
