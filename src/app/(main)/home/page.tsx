import { RequireAuth } from "@/components/require-auth";
import HomeContent from "./home-content";

export default function HomePage() {
  return (
    <RequireAuth>
      <div className="p-4">
        <HomeContent />
      </div>
    </RequireAuth>
  );
}
