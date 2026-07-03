import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getSeriesBySlug } from "@/services/series";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";

export const GET = withAuth<{ slug: string }>(async (request, { params }) => {
  const { slug } = params;

  const result = await cacheGetOrSet(
    `series:${slug}`,
    CACHE_TTL.DEFAULT,
    () => getSeriesBySlug(slug)
  );

  if (!result) return NextResponse.json({ error: "Series not found" }, { status: 404 });

  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
});
