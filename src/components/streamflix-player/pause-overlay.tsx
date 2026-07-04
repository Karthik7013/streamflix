"use client"

import { Play } from "lucide-react"

interface PauseOverlayProps {
  paused: boolean
  title: string
  poster?: string
  metadata?: {
    year?: number | string
    duration?: string
    rating?: string
    synopsis?: string
  }
  togglePlay: () => void
}

export function PauseOverlay({
  paused,
  title,
  poster,
  metadata,
  togglePlay,
}: PauseOverlayProps) {
  return (
    <div
      className={`np-pause-overlay ${paused ? "visible" : ""}`}
      onClick={togglePlay}
    >
      <div
        className="np-pause-card flex gap-[22px] items-start max-sm:flex-col max-sm:gap-3 p-[26px] max-sm:p-4 max-w-[500px] max-sm:max-w-[85vw] w-[90%] rounded-[15px]"
        onClick={(e) => e.stopPropagation()}
      >
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={title}
            className="np-pause-poster w-[95px] h-[136px] max-sm:hidden rounded-[9px] shrink-0 object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="np-pause-title text-[24px] max-sm:text-xl text-foreground leading-[1.2] mb-3">
            {title}
          </div>
          {(metadata?.year || metadata?.duration || metadata?.rating) && (
            <div className="flex gap-[7px] items-center mb-[10px] max-sm:flex-wrap">
              {metadata?.year && (
                <span className="np-pause-meta text-[12px]">
                  {metadata.year}
                </span>
              )}
              {metadata?.duration && (
                <span className="np-pause-meta text-[12px]">
                  · {metadata.duration}
                </span>
              )}
              {metadata?.rating && (
                <span className="np-pause-rating px-[6px] py-[1px] text-[10.5px] font-medium">
                  {metadata.rating}
                </span>
              )}
            </div>
          )}
          {metadata?.synopsis && (
            <p className="np-pause-synopsis text-[12.5px] mb-[16px] leading-[1.65]">
              {metadata.synopsis}
            </p>
          )}
          <button
            onClick={togglePlay}
            className="np-pause-play-btn flex items-center gap-[8px] px-[18px] py-[10px] text-[13.5px] font-semibold text-primary-foreground rounded-[8px] border-none cursor-pointer"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.04)"
              e.currentTarget.style.animation = "none"
              e.currentTarget.style.boxShadow = "0 4px 28px var(--np-primary)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = ""
              e.currentTarget.style.animation = "pulse 2.2s ease infinite"
              e.currentTarget.style.boxShadow = ""
            }}
          >
            <Play size={15} fill="currentColor" />
            &nbsp;{paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
    </div>
  )
}
