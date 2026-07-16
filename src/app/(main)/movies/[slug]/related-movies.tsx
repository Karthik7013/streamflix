import { MediaCarousel } from "@/components/media-carousel"
import { MovieCard } from "@/components/movie-card"

interface RelatedMovie {
  id: number
  title: string
  slug: string
  thumbnailUrl: string
}

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
