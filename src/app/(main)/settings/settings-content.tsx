"use client";

import { authClient } from "@/lib/auth-client";
import UserProfile from "./user-profile";
import ChangePassword from "./change-password";
import ClearWatchHistory from "./clear-watch-history";
import AdminNavigation from "./admin-navigation";
import DangerZone from "./danger-zone";

export function SettingsContent() {
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-4">
      <UserProfile />
      <ChangePassword />
      <ClearWatchHistory />
      {isAdmin && <AdminNavigation />}
      <DangerZone />
    </div>
  );
}
