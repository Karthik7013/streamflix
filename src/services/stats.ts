import { db } from "@/db";
import { movies, tags, user } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function getAdminStats() {
  const result = await db.select({
    totalMovies: sql<number>`(SELECT COUNT(*) FROM ${movies})`,
    totalTags: sql<number>`(SELECT COUNT(*) FROM ${tags})`,
    totalUsers: sql<number>`COUNT(*) FILTER (WHERE ${user.role} = 'user')`,
    totalAdmins: sql<number>`COUNT(*) FILTER (WHERE ${user.role} = 'admin')`,
  }).from(user);

  const row = result[0];
  return [
    { value: row.totalMovies },
    { value: row.totalTags },
    { value: row.totalUsers },
    { value: row.totalAdmins },
  ];
}
