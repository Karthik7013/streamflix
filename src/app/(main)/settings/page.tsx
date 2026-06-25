import { RequireAuth } from "@/components/require-auth";
import { SettingsContent } from "./settings-content";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <div className="p-4">
        <SettingsContent />
      </div>
    </RequireAuth>
  );
}
