import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getMostFavorited } from "@/services/movies";

export const GET = withAdminAuth(async () => {
  const mostFavorited = await getMostFavorited();
  return NextResponse.json(
    { mostFavorited },
    { headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
  );
});
