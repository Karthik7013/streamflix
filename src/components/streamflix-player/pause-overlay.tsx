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
      className={`absolute inset-0 z-8 flex items-center justify-center transition-opacity duration-400 ${!paused ? "opacity-0 pointer-events-none" : ""}`}
      style={{
        background: "color-mix(in srgb, var(--np-bg) 65%, transparent)",
        backdropFilter: "blur(4px)",
      }}
      onClick={togglePlay}
    >
      <div
        className="np-pause-card flex gap-[22px] items-start max-sm:flex-col max-sm:gap-3 p-[26px] max-sm:p-4 max-w-[500px] max-sm:max-w-[85vw] w-[90%] rounded-[15px]"
        style={{
          background: "color-mix(in srgb, var(--np-card) 93%, transparent)",
          backdropFilter: "blur(28px)",
          border: "1px solid var(--np-border)",
          boxShadow:
            "0 28px 90px rgba(0,0,0,0.75), 0 0 0 1px color-mix(in srgb, var(--np-primary) 12%, transparent)",
          animation: "cardIn 0.35s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt={title}
            className="np-pause-poster w-[95px] h-[136px] max-sm:hidden rounded-[9px] shrink-0 object-cover"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.55)" }}
          />
        )}
        <div className="min-w-0">
          <div
            className="np-pause-title text-[24px] max-sm:text-xl text-foreground leading-[1.2] mb-3"
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontStyle: "italic",
            }}
          >
            {title}
          </div>
          {(metadata?.year || metadata?.duration || metadata?.rating) && (
            <div className="flex gap-[7px] items-center mb-[10px] max-sm:flex-wrap">
              {metadata?.year && (
                <span className="text-[12px]" style={{ color: "var(--np-muted)" }}>
                  {metadata.year}
                </span>
              )}
              {metadata?.duration && (
                <span className="text-[12px]" style={{ color: "var(--np-muted)" }}>
                  · {metadata.duration}
                </span>
              )}
              {metadata?.rating && (
                <span
                  className="px-[6px] py-[1px] text-[10.5px] font-medium"
                  style={{
                    border: "1px solid var(--np-border)",
                    borderRadius: "3px",
                    color: "color-mix(in srgb, var(--np-fg) 55%, transparent)",
                  }}
                >
                  {metadata.rating}
                </span>
              )}
            </div>
          )}
          {metadata?.synopsis && (
            <p
              className="text-[12.5px] mb-[16px] leading-[1.65]"
              style={{
                color: "var(--np-muted)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {metadata.synopsis}
            </p>
          )}
          <button
            onClick={togglePlay}
            className="flex items-center gap-[8px] px-[18px] py-[10px] text-[13.5px] font-semibold text-primary-foreground rounded-[8px] border-none cursor-pointer"
            style={{
              background: "var(--np-primary)",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: "0.04em",
              animation: "pulse 2.2s ease infinite",
            }}
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
