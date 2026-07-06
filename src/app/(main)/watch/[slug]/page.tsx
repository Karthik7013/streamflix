import { RequireAuth } from "@/components/require-auth";
import { WatchContent } from "@/app/(main)/watch/[slug]/watch-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now Watching",
};

export default function WatchPage() {
  return (
    <RequireAuth>
      <WatchContent />
    </RequireAuth>
  );
}
