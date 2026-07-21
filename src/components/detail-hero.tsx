"use client";

import { type ReactNode } from "react";
import { ShimmerImage } from "@/components/shimmer-image";
import { Play } from "lucide-react";
import { BackButton } from "@/components/back-button";

interface DetailHeroProps {
  backdropUrl: string;
  thumbnailUrl: string;
  alt: string;
  trailerUrl?: string;
  onTrailerClick?: () => void;
  children: ReactNode;
}

export function DetailHero({ backdropUrl, thumbnailUrl, alt, trailerUrl, onTrailerClick, children }: DetailHeroProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[85vh] min-h-125 w-full overflow-hidden mb-16">
        <div className="absolute inset-0 bg-muted">
          <ShimmerImage
            src={backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            imgClassName="object-cover"
            wrapperClassName="absolute inset-0"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />
        </div>

        <div className="absolute top-4 left-4 z-20">
          <BackButton />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12 lg:p-16">
          <div className="flex gap-x-10 items-start">
            <div className="relative z-30 hidden sm:block w-28 sm:w-36 md:w-44 aspect-2/3 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group">
              <ShimmerImage
                src={thumbnailUrl}
                alt={alt}
                fill
                imgClassName="object-cover"
                wrapperClassName="absolute inset-0"
                priority
                sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 176px"
              />
              {trailerUrl && onTrailerClick && (
                <button
                  onClick={onTrailerClick}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/10 shadow-lg">
                    <Play className="ml-0.5 size-6" />
                  </div>
                </button>
              )}
            </div>
            <div className="max-w-3xl space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
