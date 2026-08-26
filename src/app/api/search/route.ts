import { NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { searchAutocomplete } from "@/services/search";
import { CACHE_CONTROL } from "@/lib/api-utils";

export const GET = withPublic(async (request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json(
      { error: { message: "Query too short", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  const data = await searchAutocomplete(q);
  return NextResponse.json({ data }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Search failed", code: "INTERNAL_ERROR" });
