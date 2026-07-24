"use client"

import * as React from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaCarouselProps {
  title?: string
  seeAllHref?: string
  children: React.ReactNode
  className?: string
  slideClassName?: string
}

export function MediaCarousel({
  title,
  seeAllHref,
  children,
  className,
  slideClassName = "basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6",
}: MediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  })

  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((api: NonNullable<typeof emblaApi>) => {
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi) // eslint-disable-line react-hooks/set-state-in-effect
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const slides = React.Children.toArray(children)
  if (slides.length === 0) return null

  return (
    <section className={cn("relative group", className)}>
      {(title || seeAllHref) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See All →
            </Link>
          )}
        </div>
      )}
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {slides.map((child, i) => (
              <div
                key={`slide-${i}`}
                className={cn("grow-0 shrink-0 min-w-0 pl-3", slideClassName)}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canScrollPrev}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-9 rounded-full",
            "bg-background/80 hover:bg-background/95 text-foreground shadow-md",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "disabled:hidden"
          )}
        >
          <ChevronLeftIcon className="size-5" />
          <span className="sr-only">Previous slides</span>
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canScrollNext}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-9 rounded-full",
            "bg-background/80 hover:bg-background/95 text-foreground shadow-md",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "disabled:hidden"
          )}
        >
          <ChevronRightIcon className="size-5" />
          <span className="sr-only">Next slides</span>
        </button>
      </div>
    </section>
  )
}
