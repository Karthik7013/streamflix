"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface NavContextValue {
  isHidden: boolean;
  setHidden: (v: boolean) => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [isHidden, setHidden] = useState(false);
  return <NavContext value={{ isHidden, setHidden }}>{children}</NavContext>;
}

export function useNavContext(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavContext must be used within a NavProvider");
  return ctx;
}
