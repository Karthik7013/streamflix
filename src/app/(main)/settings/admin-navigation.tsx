import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function AdminNavigation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin</CardTitle>
        <CardDescription>Access the admin panel to manage users and settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/admin">
          <Button variant="outline" className="w-full">
            <Shield className="size-4 mr-2" />
            Admin Panel
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
