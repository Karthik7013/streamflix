"use client";

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface ShimmerImageProps extends Omit<ImageProps, "onLoad" | "className"> {
  imgClassName?: string
  wrapperClassName?: string
}

export function ShimmerImage({ imgClassName, wrapperClassName, ...props }: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false)

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
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
