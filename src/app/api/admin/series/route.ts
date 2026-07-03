import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { createSeries, listAdminSeries } from "@/services/series";
import { validateSlug } from "@/lib/validation";
import { parseAdminListParams } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams);
  const result = await listAdminSeries({ page, limit, search, sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { title, slug } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const slugError = validateSlug(slug);
  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400 });
  }

  try {
    const created = await createSeries(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("duplicate key")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    throw err;
  }
});
