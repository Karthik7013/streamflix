import { HeroSkeleton, CarouselSkeleton } from "@/components/page-skeleton";

export default function MainLoading() {
  return (
    <main>
      <HeroSkeleton />
      <CarouselSkeleton />
      <CarouselSkeleton />
    </main>
  );
}
