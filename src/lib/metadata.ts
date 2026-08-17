import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";

const FALLBACK_OG_IMAGE = "/og-image.png";

export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : new URL(path, siteUrl()).toString();
}

export function mediaMetadata({
  title,
  description,
  url,
  image,
  type,
  siteName = "StreamFlix",
}: {
  title: string;
  description?: string;
  url: string;
  image?: string | null;
  type?: "video.movie" | "video.tv_show";
  siteName?: string;
}): Metadata {
  const desc = (description ?? "").slice(0, 160);
  const imageUrl = absoluteUrl(image || FALLBACK_OG_IMAGE);
  const fullUrl = absoluteUrl(url);

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: fullUrl,
      siteName,
      type,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [imageUrl],
    },
  };
}