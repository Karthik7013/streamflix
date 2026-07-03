import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAuth } from "@/lib/with-auth";
import { getFeatured } from "@/services/featured";

export const GET = withAuth(async () => {
  const featured = await getFeatured();
  return NextResponse.json({ featured }, { headers: { "Cache-Control": CACHE_CONTROL.PUBLIC } });
}, "Internal Server Error");
