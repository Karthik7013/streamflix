"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import "@/components/hero-trailer-background.css"
import { logger } from "@/lib/logger"

interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  seekTo: (seconds: number) => void
  destroy: () => void
}

interface YouTubePlayerOptions {
  videoId: string
  playerVars: Record<string, number | string>
  events: {
    onReady: (event: { target: YouTubePlayer }) => void
    onStateChange: (event: { data: number; target: YouTubePlayer }) => void
    onError: (event: unknown) => void
  }
}

interface YouTubeNamespace {
  Player: new (el: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
}

let apiPromise: Promise<YouTubeNamespace> | null = null

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    const win = window as unknown as {
      YT?: YouTubeNamespace
      onYouTubeIframeAPIReady?: () => void
    }
    if (win.YT) {
      resolve(win.YT)
      return
    }
    const timeout = setTimeout(
      () => reject(new Error("YouTube IFrame API load timed out")),
      15000
    )
    const prevReady = win.onYouTubeIframeAPIReady
    win.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout)
      prevReady?.()
      if (win.YT) resolve(win.YT)
    }
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.onerror = () => {
      clearTimeout(timeout)
      reject(new Error("YouTube IFrame API failed to load"))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return match ? match[1] : null
}

export interface HeroTrailerHandle {
  toggleSound: () => void
}

interface HeroTrailerBackgroundProps {
  url: string | null
  onReadyChange?: (ready: boolean) => void
  onSoundChange?: (soundOn: boolean) => void
}

export const HeroTrailerBackground = forwardRef<HeroTrailerHandle, HeroTrailerBackgroundProps>(
  function HeroTrailerBackground({ url, onReadyChange, onSoundChange }, ref) {
    const layerRef = useRef<HTMLDivElement | null>(null)
    const [mountEl] = useState(() => document.createElement("div"))
    const playerRef = useRef<YouTubePlayer | null>(null)
    const startedRef = useRef(false)
    const timerDoneRef = useRef(false)
    const inViewRef = useRef(false)
    const [failed, setFailed] = useState(false)
    const [revealed, setRevealed] = useState(false)

    const toggleSound = useCallback(() => {
      const player = playerRef.current
      if (!player) return
      if (player.isMuted()) {
        player.unMute()
        onSoundChange?.(true)
      } else {
        player.mute()
        onSoundChange?.(false)
      }
    }, [onSoundChange])

    useImperativeHandle(ref, () => ({ toggleSound }), [toggleSound])

    const startVideo = useCallback(
      async (videoId: string) => {
        startedRef.current = true
        try {
          const YT = await loadYouTubeApi()
          playerRef.current = new YT.Player(mountEl, {
            videoId,
            playerVars: {
              controls: 0,
              rel: 0,
              iv_load_policy: 3,
              playsinline: 1,
              mute: 1,
            },
            events: {
              onReady: (event) => {
                event.target.mute()
                event.target.playVideo()
                onReadyChange?.(true)
              },
              onStateChange: (event) => {
                if (event.data === 0) {
                  event.target.seekTo(0)
                  event.target.playVideo()
                } else if (event.data === 1) {
                  setRevealed(true)
                }
              },
              onError: () => {
                onReadyChange?.(false)
                setFailed(true)
              },
            },
          })
        } catch (err) {
          logger.error("hero-trailer", "Failed to start background trailer", err)
          setFailed(true)
        }
      },
      [mountEl, onReadyChange]
    )

    const maybeStart = useCallback(() => {
      if (startedRef.current || !timerDoneRef.current || !inViewRef.current || document.visibilityState !== "visible") return
      const videoId = url ? extractYouTubeId(url) : null
      if (videoId) startVideo(videoId)
    }, [url, startVideo])

    useEffect(() => {
      if (!url) return
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

      const timer = setTimeout(() => {
        timerDoneRef.current = true
        maybeStart()
      }, 3000)

      const observer = new IntersectionObserver(
        ([entry]) => {
          inViewRef.current = entry.isIntersecting
          if (entry.isIntersecting) {
            maybeStart()
            playerRef.current?.playVideo()
          } else {
            playerRef.current?.pauseVideo()
          }
        },
        { threshold: 0.15 }
      )
      if (layerRef.current) observer.observe(layerRef.current)

      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          maybeStart()
          playerRef.current?.playVideo()
        } else {
          playerRef.current?.pauseVideo()
        }
      }
      document.addEventListener("visibilitychange", onVisibility)

      return () => {
        clearTimeout(timer)
        observer.disconnect()
        document.removeEventListener("visibilitychange", onVisibility)
        playerRef.current?.destroy()
        playerRef.current = null
        onReadyChange?.(false)
      }
    }, [url, maybeStart, onReadyChange])

    useEffect(() => {
      layerRef.current?.appendChild(mountEl)
      return () => {
        mountEl.remove()
      }
    }, [mountEl])

    const videoId = url ? extractYouTubeId(url) : null
    if (!videoId || failed) return null

    return (
      <div
        className={`hero-trailer-layer${revealed ? " hero-trailer-layer--active" : ""}`}
        ref={layerRef}
        onClick={toggleSound}
      >
        <div className="hero-trailer-click-catcher" />
      </div>
    )
  }
)