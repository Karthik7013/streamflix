import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db.delete(user).where(eq(user.id, session.user.id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
