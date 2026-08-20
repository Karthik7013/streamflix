import type { Metadata } from "next";
import { Changelog } from "@/components/changelog";

export const metadata: Metadata = {
  title: "Changelog",
};

export default function ChangelogPage() {
  return (
    <Changelog
      title="Changelog"
      description="Get the latest updates and improvements to StreamFlix."
    />
  );
}