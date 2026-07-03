import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAdminAuth } from "@/lib/with-auth";
import { getMostFavorited } from "@/services/movies";

export const GET = withAdminAuth(async () => {
  const mostFavorited = await getMostFavorited();
  return NextResponse.json(
    { mostFavorited },
    { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
  );
});
