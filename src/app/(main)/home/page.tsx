import { Suspense } from "react";
import { HomeContent } from "@/app/(main)/home/home-content";
import { getFeatured } from "@/services/featured";
import { getTop10Movies } from "@/services/top10-movies";

export const revalidate = 300;

export default async function HomePage() {
  const [featured, top10] = await Promise.all([
    getFeatured(),
    getTop10Movies(),
  ]);

  return (
    <Suspense fallback={null}>
      <HomeContent featured={featured} top10={top10} />
    </Suspense>
  );
}
