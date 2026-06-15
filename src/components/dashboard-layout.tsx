"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Heart, Settings } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Explore", icon: Search, href: "/explore" },
  { label: "Favorites", icon: Heart, href: "/favorites" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative h-dvh">
      <main className="h-full overflow-y-auto pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around border-t border-muted/30 rounded-t-md bg-background/60 backdrop-blur-lg px-2 py-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors ${active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <item.icon className="size-5" />
              {item.label}
              {active && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
