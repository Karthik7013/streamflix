import { Suspense } from "react";
import { TagContent } from "./tag-content";

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <TagContent slug={slug} />
    </Suspense>
  );
}
