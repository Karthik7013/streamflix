import { Suspense } from "react";
import { ExploreContent } from "@/app/(main)/explore/explore-content";

export default function ExplorePage() {
  return (
    <div className="p-4">
      <Suspense fallback={null}>
        <ExploreContent />
      </Suspense>
    </div>
  );
}
