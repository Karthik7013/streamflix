import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { createSeries, listAdminSeries } from "@/services/series";
import { validateSlug } from "@/lib/validation";
import { CACHE_CONTROL, parseAdminListParams } from "@/lib/api-utils";
import { validateBody } from "@/lib/api-validation";
import { createSeriesApiSchema } from "@/lib/schemas";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams);
  const result = await listAdminSeries({ page, limit, search, sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(createSeriesApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const slugError = validateSlug(parsed.data.slug);
  if (slugError) {
    return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });
  }

  try {
    const created = await createSeries(parsed.data);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return NextResponse.json({ error: { message: "Slug already exists", code: "CONFLICT" } }, { status: 409 });
    }
    throw err;
  }
});
