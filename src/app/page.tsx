import { CtaBtn } from "@/components/cta-btn";
import { PosterGrid } from "@/components/poster-grid";

const HeroBanner = () => {
  return <div className="flex flex-col items-center sm:items-start">
    <main className="flex flex-col gap-10 w-full max-w-2xl items-center sm:items-start">
      <span className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
        <svg viewBox="0 0 100 100" className="size-7 shrink-0">
          <circle cx="50" cy="50" r="50" className="fill-primary" />
          <path d="M38 28 L74 50 L38 72 Z" className="fill-black" />
        </svg>
        Streamflix Studio
      </span>
      <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
        <h1 className="font-heading text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-[-0.04em] text-foreground text-balance">
          Where every frame finds you.
        </h1>
        <p className="max-w-xl text-lg md:text-xl text-muted-foreground font-medium leading-relaxed text-balance">
          Explore a curated library of films and series. From blockbusters to hidden gems, your next great watch is waiting.
        </p>
      </div>
      <CtaBtn />
    </main>
  </div>
}

const AboutSection = () => {
  return (
    <section className="relative z-10 w-full max-w-5xl px-6 py-16">
      <div className="grid gap-12 md:grid-cols-3">
        <div>
          <h2 className="text-xl font-bold mb-3">Browse & Discover</h2>
          <p className="text-muted-foreground leading-relaxed">
            Search thousands of movies and TV shows, filter by genre, and explore curated collections. From latest releases to timeless classics, find something new every time.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-3">Build Your Watchlist</h2>
          <p className="text-muted-foreground leading-relaxed">
            Save titles to your personal watchlist and pick up where you left off. Track favorites, get recommendations, and organize your viewing queue across devices.
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-3">Stream Trailers</h2>
          <p className="text-muted-foreground leading-relaxed">
            Watch trailers and previews instantly in a fast, ad-free interface. No clutter, no interruptions — just cinema, built for fans who value performance and design.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-10 sm:opacity-90 perspective-distant">
        <PosterGrid />
        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent via-20% to-background" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent via-50% to-background" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-12">
        <HeroBanner />
      </div>

      <AboutSection />
    </div>
  );
}