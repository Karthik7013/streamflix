"use client";

import { useSession } from "@/hooks/use-session";
import UserProfile from "@/app/(main)/settings/user-profile";
import ChangePassword from "@/app/(main)/settings/change-password";
import AdminNavigation from "@/app/(main)/settings/admin-navigation";
import DangerZone from "@/app/(main)/settings/danger-zone";
import LegalLinks from "@/app/(main)/settings/legal";

export function SettingsContent() {
  const session = useSession();
  const isAdmin = session.data?.user?.role === "admin";

  return (
    <div className="space-y-4">
      <UserProfile {...session} />
      <ChangePassword loading={session.loading} />
      {isAdmin && <AdminNavigation />}
      <DangerZone loading={session.loading} />
      <LegalLinks />
    </div>
  );
}
