import type { Metadata } from "next";
import { getSeriesBySlug } from "@/services/series";
import { mediaMetadata } from "@/lib/metadata";
import { SeriesDetailClient } from "@/app/(main)/series/[slug]/series-detail-client";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    return {};
  }

  return mediaMetadata({
    title: series.title,
    description: series.description ?? undefined,
    url: `/series/${series.slug}`,
    image: series.backdropUrl || series.thumbnailUrl,
    type: "video.tv_show",
  });
}

export default function SeriesDetailPage() {
  return <SeriesDetailClient />;
}
