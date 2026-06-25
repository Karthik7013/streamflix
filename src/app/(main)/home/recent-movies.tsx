import { MovieCard } from "@/components/movie-card";
import type { HomeMovie } from "./types";

export default function RecentMovies({ movies }: { movies: HomeMovie[] }) {
  if (movies.length === 0) return null;

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {movies.map((m) => (
          <div key={"ra-" + m.id} className="shrink-0 w-48">
            <MovieCard {...m} />
          </div>
        ))}
      </div>
    </section>
  );
}
