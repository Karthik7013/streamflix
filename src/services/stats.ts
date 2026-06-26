import { db } from "@/db";
import { movies, tags, user } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function getAdminStats() {
  const [[totalMovies], [totalTags], [totalUsers], [totalAdmins]] = await Promise.all([
    db.select({ value: count() }).from(movies),
    db.select({ value: count() }).from(tags),
    db.select({ value: count() }).from(user).where(eq(user.role, "user")),
    db.select({ value: count() }).from(user).where(eq(user.role, "admin")),
  ]);

  return [
    { value: totalMovies.value },
    { value: totalTags.value },
    { value: totalUsers.value },
    { value: totalAdmins.value },
  ];
}
