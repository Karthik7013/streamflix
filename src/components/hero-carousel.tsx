"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface HeroCarouselProps {
  items: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string;
  }[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const length = items.length;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % length);
  }, [length]);

  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [length, next]);

  if (length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl">
      <Link href={`/movies/${items[current].slug}`}>
        <div className="relative aspect-video md:aspect-[21/9]">
          <Image
            src={items[current].thumbnailUrl}
            alt={items[current].title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              {items[current].title}
            </h2>
          </div>
        </div>
      </Link>
      {length > 1 && (
        <div className="absolute bottom-3 right-6 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`size-2 rounded-full transition-all ${
                i === current ? "bg-white w-6" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
