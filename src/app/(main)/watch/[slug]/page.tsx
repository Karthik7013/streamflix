import { RequireAuth } from "@/components/require-auth";
import { WatchContent } from "./watch-content";
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
