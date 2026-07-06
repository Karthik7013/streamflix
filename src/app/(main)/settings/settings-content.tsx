"use client";

import { authClient } from "@/lib/auth-client";
import UserProfile from "@/app/(main)/settings/user-profile";
import ChangePassword from "@/app/(main)/settings/change-password";
import AdminNavigation from "@/app/(main)/settings/admin-navigation";
import DangerZone from "@/app/(main)/settings/danger-zone";
import LegalLinks from "@/app/(main)/settings/legal";

export function SettingsContent() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-4">
      <UserProfile />
      <ChangePassword />
      {isAdmin && <AdminNavigation />}
      <DangerZone />
      <LegalLinks />
    </div>
  );
}
