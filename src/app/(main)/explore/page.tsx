import { ExploreContent } from "./explore-content";

export default function ExplorePage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <ExploreContent />
      </div>
    </div>
  );
}
