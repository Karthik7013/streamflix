import { NextResponse } from "next/server";
import { db } from "@/db";
import { movies, tags, user } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET() {
  try {
    const [[totalMovies], [totalTags], [totalUsers], [totalAdmins]] = await Promise.all([
      db.select({ value: count() }).from(movies),
      db.select({ value: count() }).from(tags),
      db.select({ value: count() }).from(user).where(eq(user.role, "user")),
      db.select({ value: count() }).from(user).where(eq(user.role, "admin")),
    ]);

    return NextResponse.json({
      stats: [
        { value: totalMovies.value },
        { value: totalTags.value },
        { value: totalUsers.value },
        { value: totalAdmins.value },
      ],
    });
  } catch (e) {
    console.error("api/admin/stats error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
