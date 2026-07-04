"use client"

interface SkipIntroButtonProps {
  onClick: () => void
}

export function SkipIntroButton({ onClick }: SkipIntroButtonProps) {
  return (
    <button
      className="np-skip-btn"
      onClick={onClick}
    >
      <span className="np-skip-shimmer" />
      Skip Intro →
    </button>
  )
}
