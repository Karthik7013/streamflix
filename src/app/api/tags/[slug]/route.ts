import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { getTagBySlug } from "@/services/tags";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withPublic<{ slug: string }>(async (_request, { params }) => {
  const { slug } = params;
  const tag = await getTagBySlug(slug);
  if (!tag) {
    return NextResponse.json({ error: { message: "Tag not found", code: "NOT_FOUND" } }, { status: 404 });
  }
  return NextResponse.json({ data: tag }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Failed to fetch tag", code: "INTERNAL_ERROR" });
