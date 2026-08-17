"use client"

import { useEffect } from "react"
import type { RefObject } from "react"
import { siteUrl } from "@/lib/site-url"

function absoluteUrl(url: string): string {
  return url.startsWith("http") ? url : new URL(url, siteUrl()).toString()
}

interface UseMediaSessionOptions {
  videoRef: RefObject<HTMLVideoElement | null>
  title: string
  artist?: string
  artwork?: string
  playing: boolean
  duration: number
  progress: number
  togglePlay: () => void
  seekRelative: (delta: number) => void
}

export function useMediaSession({
  videoRef,
  title,
  artist,
  artwork,
  playing,
  duration,
  progress,
  togglePlay,
  seekRelative,
}: UseMediaSessionOptions) {
  useEffect(() => {
    if (!("mediaSession" in navigator)) return

    const artworkUrl = absoluteUrl(artwork || "/og-image.png")

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: artist || "StreamFlix",
      album: "StreamFlix",
      artwork: [
        { src: artworkUrl, sizes: "96x96", type: "image/jpeg" },
        { src: artworkUrl, sizes: "512x512", type: "image/jpeg" },
      ],
    })

    navigator.mediaSession.setActionHandler("play", togglePlay)
    navigator.mediaSession.setActionHandler("pause", togglePlay)
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null && videoRef.current) {
        videoRef.current.currentTime = details.seekTime
      }
    })
    navigator.mediaSession.setActionHandler("seekbackward", () => seekRelative(-10))
    navigator.mediaSession.setActionHandler("seekforward", () => seekRelative(10))

    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("seekto", null)
      navigator.mediaSession.setActionHandler("seekbackward", null)
      navigator.mediaSession.setActionHandler("seekforward", null)
      navigator.mediaSession.metadata = null
    }
  }, [videoRef, title, artist, artwork, togglePlay, seekRelative])

  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    navigator.mediaSession.playbackState = playing ? "playing" : "paused"
  }, [playing])

  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    const video = videoRef.current
    if (!video || !Number.isFinite(duration) || duration <= 0) return
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: video.playbackRate,
        position: Math.min(video.currentTime, duration),
      })
    } catch {
      // position state can throw for invalid values; ignore
    }
  }, [progress, duration, videoRef, playing])
}