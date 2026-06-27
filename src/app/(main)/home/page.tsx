import { RequireAuth } from "@/components/require-auth";
import HomeContent from "./home-content";

export default function HomePage() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}
