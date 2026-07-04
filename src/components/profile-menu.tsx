"use client";

import { useAuthLogout } from "@/hooks/use-auth-logout";
import { useSession } from "@/hooks/use-session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function ProfileMenu() {
  const { data: session, isPending } = useSession();
  const { logout, isLoggingOut } = useAuthLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
        {isPending ? (
          <Skeleton className="size-8 rounded-full" />
        ) : (
          <Avatar className="size-8">
            <AvatarImage src={session?.user?.image ?? undefined} />
            <AvatarFallback className="text-xs">
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium flex items-center gap-2">
          {session?.user?.name}
          <Badge variant={session?.user?.role === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
            {session?.user?.role === "admin" ? "Admin" : "User"}
          </Badge>
        </div>
        <div className="px-2 pb-1.5 text-xs text-muted-foreground truncate">
          {session?.user?.email}
        </div>
        <DropdownMenuItem disabled={isLoggingOut} onClick={logout}>
          {isLoggingOut ? <Loader2 className="size-4 mr-2 animate-spin" /> : <LogOut className="size-4 mr-2" />}
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
