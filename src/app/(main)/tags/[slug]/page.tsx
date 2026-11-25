import type { Metadata } from "next";
import { getTagBySlug } from "@/services/tags";
import { mediaMetadata } from "@/lib/metadata";

export const revalidate = 300;

export async function generateStaticParams() {
  const { data: tags } = await import("@/services/tags").then((m) => m.getAllTags());
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    return {};
  }

  return mediaMetadata({
    title: tag.name,
    description: tag.description ?? undefined,
    url: `/tags/${tag.slug}`,
    image: tag.imageUrl || undefined,
    type: "website",
  });
}

export default function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <div>Tag: {slug}</div>
    </Suspense>
  );
}
