import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { db } from "@/db";
import { tags } from "@/db/schema";


export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cacheGetOrSet("tags:all", 300, () =>
      db.select().from(tags)
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
