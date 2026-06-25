"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, Heart, Settings, LucideIcon } from "lucide-react";

const navItems: NavItemProps[] = [
  { label: "Home", icon: Home, href: "/home" },
  { label: "Explore", icon: Search, href: "/explore" },
  { label: "Favorites", icon: Heart, href: "/favorites" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

type NavItemProps = {
  label: string;
  icon: LucideIcon;
  href: string;
};

function BottomNavbar({ navItems }: { navItems: NavItemProps[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg px-1.5 py-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 px-3 transition-all duration-200 active:scale-90 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground/60 hover:text-muted-foreground/80"
              }`}
            >
              <item.icon
                className={`size-5 transition-transform duration-200 ${
                  active ? "scale-110" : ""
                }`}
              />
              <span className="text-[10px] leading-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-dvh">
      <main className="h-full overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNavbar navItems={navItems} />
    </div>
  );
}
