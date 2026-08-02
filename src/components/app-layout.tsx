"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Compass, UserRound, Tv, Video, LogIn, LucideIcon } from "lucide-react";
import { NavProvider, useNavContext } from "@/lib/nav-context";
import { useSession } from "@/hooks/use-session";

const navItems: NavItemProps[] = [
  { key: "home", label: "Home", icon: Home, href: "/home" },
  { key: "shorts", label: "Shorts", icon: Video, href: "/shorts" },
  { key: "explore", label: "Explore", icon: Compass, href: "/explore" },
  { key: "series", label: "Series", icon: Tv, href: "/series" },
  { key: "profile", label: "Profile", icon: UserRound, href: "/settings" },
];

interface NavItemProps {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

function BottomNavbar({
  navItems,
  visible,
}: {
  navItems: NavItemProps[];
  visible: boolean;
}) {
  const pathname = usePathname();
  const { isHidden } = useNavContext();
  const show = visible && !isHidden;

  return (
    <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ease-out ${show
        ? "bottom-4 translate-y-0 opacity-100"
        : "bottom-4 translate-y-[calc(100%+1.5rem)] opacity-0"
        } ${isHidden ? "opacity-0 pointer-events-none" : ""}`}
    >
      <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg px-1.5 py-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 px-3 transition-all duration-200 active:scale-90 ${active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground/60 hover:text-primary hover:bg-accent/50"
                }`}
            >
              <item.icon
                className={`size-5 transition-transform duration-200 ${active ? "scale-110" : ""
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { data: session, loading } = useSession();

  const items: NavItemProps[] = navItems.map((item) => {
    if (item.key !== "profile") return item;
    if (loading) return { ...item, label: "…" };
    if (session) return item;
    return { ...item, label: "Sign in", icon: LogIn, href: "/login" };
  });

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
    <NavProvider>
      <div className="relative h-dvh">
        <main ref={mainRef} className="h-full overflow-y-auto pb-20">
          {children}
        </main>
        <BottomNavbar navItems={items} visible={navVisible} />
      </div>
    </NavProvider>
  );
}
