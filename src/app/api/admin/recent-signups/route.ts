import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/with-auth";
import { getRecentSignups } from "@/services/users";

export const GET = withAdminAuth(async () => {
  const recentSignups = await getRecentSignups();
  return NextResponse.json(
    { recentSignups },
    { headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
  );
});
