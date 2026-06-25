"use client";

import { useState, useEffect, useRef } from "react";
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

function BottomNavbar({
  navItems,
  visible,
}: {
  navItems: NavItemProps[];
  visible: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ease-out ${
        visible
          ? "bottom-4 translate-y-0 opacity-100"
          : "bottom-4 translate-y-[calc(100%+1.5rem)] opacity-0"
      }`}
    >
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
  const mainRef = useRef<HTMLDivElement>(null);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = main.scrollTop;
          const delta = scrollY - lastScrollY.current;

          if (delta > 10 && scrollY > 50) {
            setNavVisible(false);
          } else if (delta < -10) {
            setNavVisible(true);
          }

          lastScrollY.current = scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative h-dvh">
      <main ref={mainRef} className="h-full overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNavbar navItems={navItems} visible={navVisible} />
    </div>
  );
}
