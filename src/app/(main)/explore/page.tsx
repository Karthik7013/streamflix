import { Suspense } from "react";
import { ExploreContent } from "@/app/(main)/explore/explore-content";

export const revalidate = 300;

export default async function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreContent />
    </Suspense>
  );
}
