import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getRecentSignups } from "@/services/users";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recentSignups = await getRecentSignups();
    return NextResponse.json({ recentSignups });
  } catch (e) {
    console.error("api/admin/recent-signups error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
