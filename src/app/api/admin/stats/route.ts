import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getAdminStats } from "@/services/stats";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getAdminStats();
    return NextResponse.json({ stats });
  } catch (e) {
    console.error("api/admin/stats error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
