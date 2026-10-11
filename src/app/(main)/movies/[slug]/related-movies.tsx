import { MediaCarousel } from "@/components/movie/media-carousel"
import { MovieCard } from "@/components/movie/movie-card"
import type { RelatedMovie } from "@/types"

export function RelatedMovies({ related }: { related: RelatedMovie[] }) {
  if (related.length === 0) return null

  return (
    <section className="pt-4">
      <MediaCarousel title="Related Movies">
        {related.map((m) => (
          <div key={m.id}>
            <MovieCard {...m} />
          </div>
        ))}
      </MediaCarousel>
    </section>
  )
}