import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminMovies, createMovie } from "@/services/movies";
import { validateSlug } from "@/lib/validation";
import { parseAdminListParams } from "@/lib/api-utils";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams);
  const result = await listAdminMovies({ page, limit, search: search ?? "", sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
  });
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();
  const { title, slug } = body;

  if (!title || !slug) {
    return NextResponse.json({ error: "Missing required fields: title, slug" }, { status: 400 });
  }

  const slugError = validateSlug(slug);
  if (slugError) {
    return NextResponse.json({ error: slugError }, { status: 400 });
  }

  const createdMovie = await createMovie(body);
  return NextResponse.json(createdMovie, { status: 201 });
});
