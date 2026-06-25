import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const recentSignups = await db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image, createdAt: user.createdAt })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5);

    return NextResponse.json({ recentSignups });
  } catch (e) {
    console.error("api/admin/recent-signups error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
