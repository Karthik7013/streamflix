import type { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { getFeatured } from "@/services/featured";
import { withPublic } from "@/lib/with-auth";

export const runtime = "edge";

export const GET = withPublic(async (request) => {
  const result = await getFeatured();
  return NextResponse.json({ data: result }, {
    headers: { "Cache-Control": CACHE_CONTROL.PUBLIC }
  });
}, { message: "Fetch Failed" });
