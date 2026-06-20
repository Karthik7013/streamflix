import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Film } from "lucide-react";

interface FavoritedMovie {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
  favCount: number;
}

export default function MostFavorited({ movies }: { movies: FavoritedMovie[] }) {
  return (
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
                {movies.map((m) => (
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
                        <Link href={`/movies/${m.slug}`} className="font-medium truncate hover:underline hover:text-primary transition-colors">
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
                {movies.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">No movies have been favorited yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
