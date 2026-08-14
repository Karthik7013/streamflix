import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function WatchlistLink() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Watchlist</CardTitle>
        <CardDescription>View all the movies you have saved.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/watchlist">
          <Button variant="outline" className="w-full">
            <Bookmark className="size-4 mr-2" />
            Open Watchlist
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}