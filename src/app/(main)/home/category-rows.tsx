"use client";

import Link from "next/link";
import { MovieCard } from "@/components/movie-card";
import type { HomeCategory } from "@/lib/api/home";

export default function CategoryRows({ categories }: { categories: HomeCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="space-y-8 pb-8">
      {categories.map((category) => (
        <section key={category.tag.id}>
          <div className="flex items-center justify-between px-4 md:px-8 lg:px-12">
            <h2 className="text-lg font-semibold">{category.tag.name}</h2>
            <Link
              href={`/explore?tags=${category.tag.id}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse All →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto overflow-y-hidden py-4 px-4 md:px-8 lg:px-12 snap-x snap-mandatory scroll-pl-4">
            {category.movies.map((movie) => (
              <div key={movie.id} className="w-40 shrink-0 snap-start">
                <MovieCard
                  title={movie.title}
                  slug={movie.slug}
                  thumbnailUrl={movie.thumbnailUrl}
                  durationSeconds={movie.durationSeconds}
                />
                <p className="mt-1.5 text-xs text-muted-foreground truncate">{movie.title}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
