import { Suspense } from "react";
import { SeriesContent } from "@/app/(main)/series/series-content";

export default function SeriesExplorePage() {
  return (
    <div className="p-4">
      <Suspense fallback={null}>
        <SeriesContent />
      </Suspense>
    </div>
  );
}
