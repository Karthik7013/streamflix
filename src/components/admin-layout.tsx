"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Film, Tags, Users, ChevronLeft, Star, ListChecks, Tv, Flag, Activity, ExternalLink, Search,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { STATUS_PAGE_URL } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { label: "Movies", icon: Film, href: "/admin/movies" },
  { label: "Series", icon: Tv, href: "/admin/series" },
  { label: "Featured", icon: Star, href: "/admin/featured" },
  { label: "Featured Series", icon: Tv, href: "/admin/featured-series" },
  { label: "Requests", icon: ListChecks, href: "/admin/requests" },
  { label: "Reports", icon: Flag, href: "/admin/reports" },
  { label: "Tags", icon: Tags, href: "/admin/tags" },
  { label: "Users", icon: Users, href: "/admin/users" },
  { label: "Health", icon: Activity, href: "/admin/health" },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link href="/admin" />} className="hover:bg-transparent hover:text-inherit active:bg-transparent data-active:bg-transparent group-data-[collapsible=icon]:justify-center">
                <svg viewBox="0 0 100 100" className="size-8 shrink-0">
                  <circle cx="50" cy="50" r="50" className="fill-primary" />
                  <path d="M38 28 L74 50 L38 72 Z" className="fill-black" />
                </svg>
                <span className="font-semibold group-data-[collapsible=icon]:hidden">StreamFlix</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                      onClick={() => { if (isMobile) setOpenMobile(false) }}
                    >
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<a href={STATUS_PAGE_URL} target="_blank" rel="noopener noreferrer" />}>
                <ExternalLink className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Status</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/home" />} onClick={() => { if (isMobile) setOpenMobile(false) }}>
                <ChevronLeft className="size-4" />
                <span className="group-data-[collapsible=icon]:hidden">Back to app</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-background flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </button>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 min-w-0">{children}</div>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </SidebarInset>
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </SidebarProvider>
  );
}
