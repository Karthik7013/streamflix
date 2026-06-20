import { db } from "@/db";
import { movies, tags, user, favorites } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import StatsCards from "./stats-cards";
import RecentSignups from "./recent-signups";
import MostFavorited from "./most-favorited";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [totalMovies] = await db.select({ value: count() }).from(movies);
  const [totalTags] = await db.select({ value: count() }).from(tags);
  const [totalUsers] = await db.select({ value: count() }).from(user).where(eq(user.role, "user"));
  const [totalAdmins] = await db.select({ value: count() }).from(user).where(eq(user.role, "admin"));

  const recentSignups = await db
    .select({ id: user.id, name: user.name, email: user.email, image: user.image, createdAt: user.createdAt })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(5);

  const mostFavorited = await db
    .select({
      id: movies.id,
      title: movies.title,
      slug: movies.slug,
      thumbnailUrl: movies.thumbnailUrl,
      favCount: count(favorites.movieId),
    })
    .from(movies)
    .innerJoin(favorites, eq(movies.id, favorites.movieId))
    .groupBy(movies.id)
    .orderBy(desc(count(favorites.movieId)))
    .limit(5);

  const stats = [
    { value: totalMovies.value },
    { value: totalTags.value },
    { value: totalUsers.value },
    { value: totalAdmins.value },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your site metrics.</p>
      </div>
      <StatsCards stats={stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSignups users={recentSignups} />
        <MostFavorited movies={mostFavorited} />
      </div>
    </div>
  );
}
