import { RequireAuth } from "@/components/require-auth";
import { SettingsContent } from "@/app/(main)/settings/settings-content";

export default function SettingsPage() {
  return (
    <RequireAuth redirectTo="/login?redirect=/settings">
      <div className="p-4">
        <SettingsContent />
      </div>
    </RequireAuth>
  );
}