import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await auth.api.signOut({ headers: request.headers });
    await db.delete(user).where(eq(user.id, session.user.id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
