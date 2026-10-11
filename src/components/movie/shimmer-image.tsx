"use client";

import { memo, useCallback, useState } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"
import { Film, type LucideIcon } from "lucide-react"

interface ShimmerImageProps extends Omit<ImageProps, "onLoad" | "className"> {
  imgClassName?: string
  wrapperClassName?: string
  fallbackIcon?: LucideIcon
}

export const ShimmerImage = memo(function ShimmerImage({ priority, imgClassName, wrapperClassName, fallbackIcon: FallbackIcon = Film, ...props }: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])
  const onError = useCallback(() => setError(true), [])
  const isPriority = priority === true
  const hasSrc = Boolean(props.src)

  if (!hasSrc || error) {
    return (
      <div className={cn("relative overflow-hidden", wrapperClassName)}>
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <FallbackIcon className="size-1/3 text-muted-foreground/40" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {!isPriority && !loaded && (
        <div className="absolute inset-0 animate-[shimmer-slide_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        {...props}
        className={cn(
          isPriority ? "opacity-100" : "transition-opacity duration-500",
          isPriority ? "" : loaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  )
})
