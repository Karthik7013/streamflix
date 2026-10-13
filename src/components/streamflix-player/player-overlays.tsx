"use client"

import { ChevronLeft, RefreshCw } from "lucide-react"

export function PlayerLoadingOverlay() {
  return (
    <div className="np-loading-container">
      <div className="np-spinner" />
    </div>
  )
}

export function PlayerErrorOverlay({
  error,
  onRetry,
  onBack,
}: {
  error: string
  onRetry: () => void
  onBack?: () => void
}) {
  return (
    <div className="np-error-overlay">
      <div className="np-error-icon">!</div>
      <p className="np-error-text">{error}</p>
      <div className="np-error-actions">
        <button className="np-error-retry" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </button>
        {onBack && (
          <button className="np-error-back" onClick={onBack}>
            <ChevronLeft className="size-4" />
            Go back
          </button>
        )}
      </div>
    </div>
  )
}
