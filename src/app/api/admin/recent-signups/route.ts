import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAdminAuth } from "@/lib/with-auth";
import { getRecentSignups } from "@/services/users";

export const GET = withAdminAuth(async () => {
  const recentSignups = await getRecentSignups();
  return NextResponse.json(
    { recentSignups },
    { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
  );
});
