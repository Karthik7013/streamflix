"use client"

import { useState, useEffect, useRef } from "react"

interface NextEpisodeInfo {
  title: string
  onPlay: () => void
  countdownSeconds?: number
}

export function useAutoPlay(progress: number, nextEpisode?: NextEpisodeInfo | null) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const cntRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (progress >= 93 && countdown === null && nextEpisode) {
      const id = setTimeout(() => setCountdown(nextEpisode.countdownSeconds ?? 30), 0);
      return () => clearTimeout(id);
    }
  }, [progress, countdown, nextEpisode])

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      cntRef.current = setTimeout(
        () => setCountdown((c) => (c !== null ? c - 1 : null)),
        1000,
      )
    }
    if (countdown === 0 && nextEpisode) {
      nextEpisode.onPlay()
    }
    return () => clearTimeout(cntRef.current)
  }, [countdown, nextEpisode])

  return { countdown, setCountdown }
}
