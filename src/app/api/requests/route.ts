import type { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getRequests } from "@/services/requests";
import { withPublic } from "@/lib/with-auth";

export const runtime = "edge";

export const GET = withPublic(async (request) => {
  const result = await getRequests();
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PRIVATE },
  });
}, { message: "Fetch Failed" });
