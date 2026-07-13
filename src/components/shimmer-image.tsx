"use client";

import { memo, useCallback, useState } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface ShimmerImageProps extends Omit<ImageProps, "onLoad" | "className"> {
  imgClassName?: string
  wrapperClassName?: string
}

export const ShimmerImage = memo(function ShimmerImage({ imgClassName, wrapperClassName, ...props }: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false)
  const onLoad = useCallback(() => setLoaded(true), [])

  return (
    <div className={cn("relative overflow-hidden", wrapperClassName)}>
      {!loaded && (
        <div className="absolute inset-0 animate-[shimmer-slide_1.5s_infinite] bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
      )}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image
        {...props}
        className={cn(
          "transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName
        )}
        onLoad={onLoad}
      />
    </div>
  )
})
