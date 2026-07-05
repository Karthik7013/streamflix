"use client"

interface NextEpisodeCardProps {
  nextEpisode: {
    title: string
    onPlay: () => void
  }
  countdown: number
  ringOffset: number
  R: number
  C: number
  onCancel: () => void
}

export function NextEpisodeCard({
  nextEpisode,
  countdown,
  ringOffset,
  R,
  C,
  onCancel,
}: NextEpisodeCardProps) {
  return (
    <div className="np-next-card">
      <div className="np-next-thumb">
        <div className="np-next-bg-gradient" />
        <div className="absolute top-[8px] right-[8px] z-1">
          <svg width="38" height="38" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke="color-mix(in srgb, var(--np-fg) 12%, transparent)"
              strokeWidth="3.5"
            />
            <circle
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke="var(--np-primary)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 22 22)"
              className="np-next-countdown-ring"
            />
            <text
              x="22"
              y="26.5"
              textAnchor="middle"
              fill="var(--np-fg)"
              fontSize="12"
              fontWeight="700"
              fontFamily="'DM Sans', sans-serif"
            >
              {countdown}
            </text>
          </svg>
        </div>
        <span className="np-next-label">Up Next</span>
      </div>
      <div className="np-next-info">
        <div className="np-next-label">Next Film</div>
        <div className="np-next-title">{nextEpisode.title}</div>
      </div>
      <div className="flex items-center justify-between">
        <button
          className="np-next-play-btn px-[14px] py-[6px] text-[12px] font-semibold text-primary-foreground rounded-[6px] border-none cursor-pointer"
          onClick={() => nextEpisode.onPlay()}
        >
          Play Now
        </button>
        <button
          className="np-next-cancel-btn bg-none border-none text-[11px] cursor-pointer underline"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
