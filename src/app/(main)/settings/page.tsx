import { RequireAuth } from "@/components/require-auth";
import { SettingsContent } from "./settings-content";

export default function SettingsPage() {
  return (
    <RequireAuth>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <SettingsContent />
        </div>
      </div>
    </RequireAuth>
  );
}
