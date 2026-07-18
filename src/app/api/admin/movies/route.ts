import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { listAdminMovies } from "@/services/movies-admin";
import { createMovie } from "@/services/movies-admin";
import { validateSlug } from "@/lib/validation";
import { CACHE_CONTROL, parseAdminListParams } from "@/lib/api-utils";
import { validateBody } from "@/lib/api-validation";
import { createMovieApiSchema } from "@/lib/schemas";

export const GET = withAdminAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams);
  const result = await listAdminMovies({ page, limit, search: search ?? "", sortBy, sortDir, columnFilters });
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
});

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(createMovieApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const slugError = validateSlug(parsed.data.slug);
  if (slugError) {
    return NextResponse.json({ error: { message: slugError, code: "INVALID_SLUG" } }, { status: 400 });
  }

  const createdMovie = await createMovie(parsed.data);
  return NextResponse.json({ data: createdMovie }, { status: 201 });
});
