import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { searchTMDB } from "@/services/tmdb";
import { validateBody } from "@/lib/api-validation";
import { tmdbSearchApiSchema } from "@/lib/schemas";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const POST = withAdminAuth(async (request) => {
  const body = await request.json();

  const parsed = validateBody(tmdbSearchApiSchema, body);
  if ("error" in parsed) return parsed.error;

  const { query } = parsed.data;
  const results = await searchTMDB(query);
  return NextResponse.json({ results }, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
});
