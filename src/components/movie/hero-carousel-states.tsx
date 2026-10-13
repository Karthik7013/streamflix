"use client";

import { Film } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const EmptyCarousel = () => {
  return <div className="relative flex items-center justify-center h-[60vh] md:h-[60vh] md:min-h-[460px] xl:h-[70vh] bg-muted overflow-hidden">
    <div className="absolute inset-0 bg-linear-to-b from-muted/50 to-background" />
    <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
      <div className="flex items-center justify-center size-16 rounded-full bg-muted-foreground/10">
        <Film className="size-7 text-muted-foreground/50" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground/70">Featured section empty</p>
        <p className="text-xs text-muted-foreground/40 max-w-xs">
          No titles have been featured yet. Check back later or add featured content from the admin panel.
        </p>
      </div>
    </div>
  </div>
}

export const CarouselLoading = () => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto space-y-12">
        <div>
          <Skeleton className="h-[60vh] md:min-h-[460px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
