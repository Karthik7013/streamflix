import { RequireAuth } from "@/components/require-auth";
import { FavoritesContent } from "./favorites-content";

export default function FavoritesPage() {
  return (
    <RequireAuth>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <FavoritesContent />
        </div>
      </div>
    </RequireAuth>
  );
}
