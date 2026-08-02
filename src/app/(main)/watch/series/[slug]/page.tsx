import { Suspense } from "react";
import { WatchSeriesContent } from "@/app/(main)/watch/series/[slug]/watch-series-content";

export default function WatchSeriesPage() {
  return (
    <Suspense fallback={null}>
      <WatchSeriesContent />
    </Suspense>
  );
}
