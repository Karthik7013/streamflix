import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getTop10Series } from "@/services/series-top10";

export const GET = withAuth(async () => {
  const top10 = await getTop10Series();
  return NextResponse.json({ data: top10 }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC },
  });
}, { message: "Internal Server Error", code: "INTERNAL_ERROR" });
