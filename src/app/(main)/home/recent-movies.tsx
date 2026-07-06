import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import type { HomeMovie } from "@/app/(main)/home/types";
import { NumberSVG } from "@/components/number-svg";

export default function RecentMovies({ movies }: { movies: HomeMovie[] }) {
  if (movies.length === 0)
    return (
      <section className="md:p-16">
        <h2 className="text-xl font-semibold mb-4">Trending Now · Top 10</h2>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No recent additions.</p>
        </div>
      </section>
    );

  return (
    <section className="md:p-16">
      <h2 className="text-xl font-semibold mb-4">Trending Now · Top 10</h2>
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden py-4 pl-4 snap-x snap-mandatory scroll-pl-4">
        {movies.map((movie, index) => {
          const number = index + 1;
          return (
            <Link
              key={"ra-" + movie.id}
              href={`/movies/${movie.slug}`}
              className="group shrink-0 snap-start"
            >
              <div className="flex items-center">
                <NumberSVG
                  number={number}
                />
                <div className={`relative z-10 w-44 shrink-0 ${number > 1 ? "md:-ml-16" : "md:-ml-4"}`}>
                  <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted shadow-lg transition-transform group-hover:scale-105">
                    {movie.thumbnailUrl && (
                      <Image
                        src={movie.thumbnailUrl}
                        alt={movie.title}
                        fill
                        sizes="176px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                        priority={index < 4}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section >
  );
}
