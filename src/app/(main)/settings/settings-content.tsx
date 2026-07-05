"use client";

import { authClient } from "@/lib/auth-client";
import UserProfile from "@/app/(main)/settings/user-profile";
import ChangePassword from "@/app/(main)/settings/change-password";
import AdminNavigation from "@/app/(main)/settings/admin-navigation";
import DangerZone from "@/app/(main)/settings/danger-zone";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function SettingsContent() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-4">
      <UserProfile />
      <ChangePassword />
      {isAdmin && <AdminNavigation />}
      <DangerZone />
      <Card>
        <CardHeader>
          <CardTitle>Legal</CardTitle>
          <CardDescription>Terms, privacy, and other policies.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/dmca" className="text-muted-foreground hover:text-foreground transition-colors">
            DMCA
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
