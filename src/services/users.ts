import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cacheDelByPrefix, cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { cacheKeys } from "@/lib/cache-keys";

export async function deleteAccount(userId: string, headers: Headers) {
  await db.transaction(async (tx) => {
    await tx.delete(user).where(eq(user.id, userId));
  });
  await cacheDelByPrefix(`watchlist:user:${userId}`);
  await auth.api.signOut({ headers });
  return true;
}

export async function getRecentSignups(limit = 5) {
  return cacheGetOrSet(cacheKeys.adminRecentSignups(limit), CACHE_TTL.FAST, () =>
    db
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
      .limit(limit)
  );
}
