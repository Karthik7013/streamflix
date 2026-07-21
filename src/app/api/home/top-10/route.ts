import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getTop10Movies } from "@/services/top10-movies";

export const GET = withAuth(async () => {
  const movies = await getTop10Movies();
  return NextResponse.json({ data: movies }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Internal Server Error", code: "INTERNAL_ERROR" });
