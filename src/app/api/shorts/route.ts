import { NextRequest, NextResponse } from "next/server";
import { withPublic } from "@/lib/with-auth";
import { CACHE_CONTROL, safeParseInt } from "@/lib/api-utils";
import { getShorts } from "@/services/shorts";

export const GET = withPublic(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(safeParseInt(searchParams.get("limit"), 10), 1), 50);
  const cursorParam = searchParams.get("cursor");
  const cursor = cursorParam ? safeParseInt(cursorParam, 0) || undefined : undefined;

  const result = await getShorts({ limit, cursor });
  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
}, { message: "Failed to fetch shorts", code: "INTERNAL_ERROR" });
