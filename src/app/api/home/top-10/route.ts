import type { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getTop10Movies } from "@/services/top10-movies";
import { withPublic } from "@/lib/with-auth";

export const runtime = "edge";

export const GET = withPublic(async (request) => {
  const result = await getTop10Movies();
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, { message: "Fetch Failed" });
