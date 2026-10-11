import { RequireAuth } from "@/components/layout/require-auth";
import { WatchlistContent } from "@/app/(main)/watchlist/watchlist-content";

export default function WatchlistPage() {
  return (
    <RequireAuth redirectTo="/login?redirect=/watchlist">
      <WatchlistContent />
    </RequireAuth>
  );
}