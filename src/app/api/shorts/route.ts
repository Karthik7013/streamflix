import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getShorts } from "@/services/shorts";

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "10") || 10, 1), 50);
  const cursor = searchParams.get("cursor") ? parseInt(searchParams.get("cursor")!) : undefined;

  const result = await getShorts({ limit, cursor });
  return NextResponse.json(result, { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } });
}, { message: "Failed to fetch shorts", code: "INTERNAL_ERROR" });
