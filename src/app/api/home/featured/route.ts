import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withPublic } from "@/lib/with-auth";
import { getFeatured } from "@/services/featured";

export const GET = withPublic(async () => {
  const featured = await getFeatured();
  return NextResponse.json({ data: featured }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, { message: "Internal Server Error", code: "INTERNAL_ERROR" });
