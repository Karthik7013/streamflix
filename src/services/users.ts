import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function deleteAccount(userId: string, headers: Headers) {
  await auth.api.signOut({ headers });
  await db.delete(user).where(eq(user.id, userId));
  return true;
}

export async function getRecentSignups(limit = 5) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);
}
