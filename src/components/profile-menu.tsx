"use client";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileMenu() {
  const { data: session, isPending } = authClient.useSession();

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
        <div className="px-2 py-1.5 text-sm font-medium">{session?.user?.name}</div>
        <div className="px-2 pb-1.5 text-xs text-muted-foreground truncate">
          {session?.user?.email}
        </div>
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut();
            window.location.replace("/login");
          }}
        >
          <LogOut className="size-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
