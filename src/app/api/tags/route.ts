import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db.select().from(tags);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
