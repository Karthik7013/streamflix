"use client";

import { useState, useEffect, useRef } from "react";
import { Film, ArrowUp, ArrowDown, Trash2, Plus, Search, Loader2Icon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type FeaturedMovie = {
  id: number;
  movieId: number;
  displayOrder: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

type Movie = {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string;
};

export default function FeaturedMoviesPage() {
  const [featured, setFeatured] = useState<FeaturedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const snapshotRef = useRef<FeaturedMovie[] | null>(null);

  const fetchFeatured = async () => {
    try {
      const res = await fetch("/api/admin/featured");
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setFeatured(data.featured || []);
    } catch (e) {
      console.error("Failed to fetch featured movies", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  const searchMovies = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/admin/movies?search=${encodeURIComponent(q)}&limit=10`);
    const data = await res.json();
    setSearchResults(data.movies || []);
    setSearching(false);
  };

  const addFeatured = async (movieId: number) => {
    const matching = searchResults.find((m) => m.id === movieId);
    if (!matching) return;
    snapshotRef.current = [...featured];
    const optimistic: FeaturedMovie = {
      id: -Date.now(),
      movieId,
      displayOrder: featured.length,
      title: matching.title,
      slug: matching.slug,
      thumbnailUrl: matching.thumbnailUrl,
    };
    setFeatured((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ movieId }),
      });
      if (!res.ok) throw new Error();
      setAddOpen(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchFeatured();
    } catch {
      if (snapshotRef.current) setFeatured(snapshotRef.current);
    }
  };

  const removeFeatured = async (id: number) => {
    snapshotRef.current = [...featured];
    setFeatured((prev) => prev.filter((f) => f.id !== id));

    try {
      const res = await fetch(`/api/admin/featured/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      if (snapshotRef.current) setFeatured(snapshotRef.current);
    }
  };

  const swapItems = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === featured.length - 1) return;
    const items = [...featured];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    [items[index], items[swapIdx]] = [items[swapIdx], items[index]];

    snapshotRef.current = [...featured];
    setFeatured(items);

    try {
      const res = await Promise.all([
        fetch(`/api/admin/featured/${items[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: items[index].displayOrder }),
        }),
        fetch(`/api/admin/featured/${items[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: items[swapIdx].displayOrder }),
        }),
      ]);
      if (res.some((r) => !r.ok)) throw new Error();
    } catch {
      if (snapshotRef.current) setFeatured(snapshotRef.current);
    }
  };

  const alreadyFeaturedIds = new Set(featured.map((f) => f.movieId));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Featured Movies</h1>
          <p className="text-muted-foreground mt-1">
            Manage which movies appear on the home page.
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4 mr-2" />
            Add Movie
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Featured Movie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => searchMovies(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {searching ? (
                  <div className="flex justify-center py-8">
                    <Loader2Icon className="size-5 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((movie) => {
                    const isFeatured = alreadyFeaturedIds.has(movie.id);
                    return (
                      <button
                        key={movie.id}
                        onClick={() => !isFeatured && addFeatured(movie.id)}
                        disabled={isFeatured}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                      >
                        {movie.thumbnailUrl ? (
                          <img src={movie.thumbnailUrl} alt={movie.title} className="size-10 rounded object-cover" />
                        ) : (
                          <div className="size-10 rounded bg-muted flex items-center justify-center">
                            <Film className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium truncate flex-1">{movie.title}</span>
                        {isFeatured && <span className="text-xs text-muted-foreground">Already featured</span>}
                      </button>
                    );
                  })
                ) : searchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No movies found.</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Type to search movies.</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2Icon className="size-6 animate-spin text-primary" />
            </div>
          ) : featured.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Star className="size-10 mx-auto mb-3 opacity-30" />
              <p>No featured movies yet.</p>
              <p className="text-sm mt-1">Click &quot;Add Movie&quot; to feature movies on the home page.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium w-[50%]">Movie</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {featured.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <div className="size-10 rounded-md overflow-hidden bg-muted shrink-0">
                            <img src={item.thumbnailUrl} alt={item.title} className="size-full object-cover" />
                          </div>
                        ) : (
                          <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Film className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">
                      #{item.displayOrder + 1}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => swapItems(index, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => swapItems(index, "down")}
                          disabled={index === featured.length - 1}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeFeatured(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
