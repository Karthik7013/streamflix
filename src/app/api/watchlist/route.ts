import type { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { watchlistApi } from "@/lib/api-client/watchlist";
import { withPublic } from "@/lib/with-auth";

export const runtime = "edge";

export const GET = withPublic(async (request) => {
  const { searchParams } = new URL(request.url);
  const params = searchParams.toString();
  const result = await watchlistApi.list(params);
  return NextResponse.json(result, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
}, { message: "Fetch Failed" });
