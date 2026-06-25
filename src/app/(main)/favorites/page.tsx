import { RequireAuth } from "@/components/require-auth";
import { FavoritesContent } from "./favorites-content";

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <div className="p-4">
        <FavoritesContent />
      </div>
    </RequireAuth>
  );
}
