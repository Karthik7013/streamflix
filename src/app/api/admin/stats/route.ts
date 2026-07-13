import { NextResponse } from "next/server";
import { CACHE_CONTROL } from "@/lib/api-utils";
import { withAdminAuth } from "@/lib/with-auth";
import { getAdminStats } from "@/services/stats";

export const GET = withAdminAuth(async () => {
  const stats = await getAdminStats();
  return NextResponse.json(
    { data: stats },
    { headers: { "Cache-Control": CACHE_CONTROL.PRIVATE } }
  );
});
