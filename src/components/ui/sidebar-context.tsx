"use client"

import * as React from "react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarState = {
  state: "expanded" | "collapsed"
  open: boolean
  openMobile: boolean
  isMobile: boolean
}

type SidebarActions = {
  setOpen: (open: boolean) => void
  setOpenMobile: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarStateContext = React.createContext<SidebarState | null>(null)
const SidebarActionsContext = React.createContext<SidebarActions | null>(null)

function useSidebarState(): SidebarState {
  const ctx = React.useContext(SidebarStateContext)
  if (!ctx) throw new Error("useSidebarState must be used within a SidebarProvider.")
  return ctx
}

function useSidebarActions(): SidebarActions {
  const ctx = React.useContext(SidebarActionsContext)
  if (!ctx) throw new Error("useSidebarActions must be used within a SidebarProvider.")
  return ctx
}

function useSidebar(): SidebarState & SidebarActions {
  return { ...useSidebarState(), ...useSidebarActions() }
}

export {
  SidebarActionsContext,
  SidebarStateContext,
  SIDEBAR_COOKIE_NAME,
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_KEYBOARD_SHORTCUT,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_ICON,
  SIDEBAR_WIDTH_MOBILE,
  useSidebar,
  useSidebarActions,
  useSidebarState,
}
export type { SidebarActions, SidebarState }
