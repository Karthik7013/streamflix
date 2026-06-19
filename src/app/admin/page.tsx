import { db } from "@/db";
import { movies, tags, user, favorites } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";
import Image from "next/image";
import { Film, Tags as TagsIcon, Users, ShieldCheck, Heart, UserPlus } from "lucide-react";

const statConfig = [
  { label: "Total Movies", icon: Film, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", border: "border-l-blue-500" },
  { label: "Total Tags", icon: TagsIcon, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", border: "border-l-emerald-500" },
  { label: "Total Users", icon: Users, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", border: "border-l-amber-500" },
  { label: "Total Admins", icon: ShieldCheck, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400", border: "border-l-rose-500" },
];

export default async function AdminDashboard() {
  const [totalMovies] = await db.select({ value: count() }).from(movies);
  const [totalTags] = await db.select({ value: count() }).from(tags);
  const [totalUsers] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "user"));
  const [totalAdmins] = await db
    .select({ value: count() })
    .from(user)
    .where(eq(user.role, "admin"));

  const recentSignups = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
    })
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
        <p className="text-muted-foreground mt-1">
          Overview of your site metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const config = statConfig[i];
          const Icon = config.icon;
          return (
            <Card key={i} className={`border-l-4 ${config.border} overflow-hidden`}>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-3 ${config.color}`}>
                    <Icon className="size-6" />
                  </div>
                  <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-4">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="size-5 text-blue-500" />
            Recent Signups
          </h2>
          <Card className="overflow-hidden p-0">
            <CardContent className="p-0 overflow-x-auto">
              <div className="max-h-[400px] min-h-[200px] overflow-y-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground sticky top-0 z-10">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSignups.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            <Image src={u.image} alt={`${u.name}'s avatar`} width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                              {(u.name?.charAt(0) || "?").toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium truncate max-w-[120px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground truncate max-w-40">
                        {u.email}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                        {u.createdAt?.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                  {recentSignups.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        No users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="size-5 text-rose-500" />
            Most Favorited
          </h2>
          <Card className="overflow-hidden p-0">
            <CardContent className="p-0 overflow-x-auto">
              <div className="max-h-[400px] min-h-[200px] overflow-y-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground sticky top-0 z-10">
                    <th className="px-4 py-3 font-medium">Movie</th>
                    <th className="px-4 py-3 font-medium">Favorites</th>
                  </tr>
                </thead>
                <tbody>
                  {mostFavorited.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {m.thumbnailUrl ? (
                            <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
                              <Image src={m.thumbnailUrl} alt={m.title} width={40} height={40} className="size-full object-cover" />
                            </div>
                          ) : (
                            <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                              <Film className="size-4 text-muted-foreground" />
                            </div>
                          )}
                          <Link
                            href={`/movies/${m.slug}`}
                            className="font-medium truncate hover:underline hover:text-primary transition-colors"
                          >
                            {m.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 dark:text-rose-400">
                          <Heart className="size-3.5 fill-current" />
                          {m.favCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {mostFavorited.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                        No movies have been favorited yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
