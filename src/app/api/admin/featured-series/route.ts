import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminFeaturedSeries, addFeaturedSeries } from "@/services/featured-series";
import { validateBody } from "@/lib/api-validation";
import { addFeaturedSeriesApiSchema } from "@/lib/schemas";
import { invalidateCache } from "@/lib/cache";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withAdminAuth(async () => {
  const result = await listAdminFeaturedSeries();
  return NextResponse.json(
    { data: result },
    { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
  );
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(addFeaturedSeriesApiSchema, body);
  if ("error" in parsed) return parsed.error;

  try {
    const created = await addFeaturedSeries(parsed.data.seriesId);
    await invalidateCache("home");
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: { message: "Series is already featured", code: "CONFLICT" } }, { status: 409 });
    }
    throw error;
  }
});
