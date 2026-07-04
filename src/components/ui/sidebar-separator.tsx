"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
}

export { SidebarSeparator }
