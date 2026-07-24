import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withPublic } from "@/lib/with-auth";
import { getSeriesBySlug } from "@/services/series";

export const GET = withPublic<{ slug: string }>(async (request, { params }) => {
  const { slug } = params;

  const result = await getSeriesBySlug(slug);

  if (!result) return NextResponse.json({ error: { message: "Series not found", code: "NOT_FOUND" } }, { status: 404 });

  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
});
