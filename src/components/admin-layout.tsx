"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Film, Tags, Users, ChevronLeft, Star, ListChecks, Tv, Flag, Activity, ExternalLink,
} from "lucide-react";
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
              <SidebarMenuButton render={<a href="https://s5m00ycf.status.cron-job.org/" target="_blank" rel="noopener noreferrer" />}>
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
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 min-w-0">{children}</div>
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
