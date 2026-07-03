import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getAdminStats } from "@/services/stats";

export const GET = withAdminAuth(async () => {
  const stats = await getAdminStats();
  return NextResponse.json(
    { stats },
    { headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
  );
});
