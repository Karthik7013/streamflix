import { RequireAuth } from "@/components/require-auth";
import HomeContent from "./home-content";

export default function HomePage() {
  return (
    <RequireAuth>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto space-y-8">
          <HomeContent />
        </div>
      </div>
    </RequireAuth>
  );
}
