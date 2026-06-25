import { getFeatured } from "@/services/featured";
import { getRecentlyAdded } from "@/services/recent";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/error-state";
import type { HeroCarouselItem } from "@/components/hero-carousel";
import WatchMovies from "./watch-movies";
import RecentMovies from "./recent-movies";

const HeroCarousel = dynamic(
  () => import("@/components/hero-carousel").then((m) => ({ default: m.HeroCarousel })),
  {
    loading: () => <Skeleton className="aspect-video md:aspect-21/9 rounded-xl" />,
  }
);

export default async function HomeContent() {
  let featured: HeroCarouselItem[] = [];
  try {
    featured = await getFeatured();
  } catch {
    return (
      <div className="flex items-center justify-center p-12">
        <ErrorState message="Failed to load featured movies." />
      </div>
    );
  }

  let recentlyAdded: Awaited<ReturnType<typeof getRecentlyAdded>> = [];
  try {
    recentlyAdded = await getRecentlyAdded();
  } catch {
    recentlyAdded = [];
  }

  return (
    <>
      <section className="pb-6">
        <HeroCarousel items={featured} />
      </section>
      <WatchMovies />
      <RecentMovies movies={recentlyAdded} />
    </>
  );
}
