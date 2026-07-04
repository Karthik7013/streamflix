import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

import type { Signup } from "@/types";

export default function RecentSignups({ users }: { users: Signup[] }) {
  return (
    <div className="min-w-0">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <UserPlus className="size-5 text-blue-500" />
        Recent Signups
      </h2>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0 overflow-x-auto">
          <div className="max-h-[400px] min-h-[200px] overflow-y-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground sticky top-0 z-10">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        {u.image ? (
                          <Image src={u.image} alt={`${u.name}'s avatar`} width={32} height={32} className="size-8 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="size-8 shrink-0 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {(u.name?.charAt(0) || "?").toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium truncate max-w-[120px]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground truncate max-w-40">{u.email}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No users yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
