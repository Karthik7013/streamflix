import { WatchContent } from "./watch-content";
import type { Metadata } from "next";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [movie] = await db
      .select({ title: movies.title })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);
    if (movie) {
      return { title: `Now Watching — ${movie.title}` };
    }
  } catch {
    // fallback
  }
  return { title: "Now Watching" };
}

export default async function WatchPage() {
  return <WatchContent />;
}
