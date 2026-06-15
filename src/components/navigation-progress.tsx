"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_DURATION = 500;
const TIMEOUT = 30000;

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const startTimeRef = useRef(0);
  const mountedRef = useRef(false);

  const start = () => {
    startTimeRef.current = Date.now();
    setProgress(0);
    setVisible(true);
    clearInterval(timerRef.current);
    clearTimeout(timeoutTimerRef.current);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) return prev + 8;
        if (prev < 50) return prev + 4;
        if (prev < 70) return prev + 2;
        if (prev < 85) return prev + 1;
        if (prev < 95) return prev + 0.5;
        return prev;
      });
    }, 200);
    timeoutTimerRef.current = setTimeout(done, TIMEOUT);
  };

  const done = () => {
    const elapsed = Date.now() - startTimeRef.current;
    clearInterval(timerRef.current);
    clearTimeout(timeoutTimerRef.current);
    setProgress(100);
    const delay = Math.max(0, MIN_DURATION - elapsed);
    doneTimerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, delay + 300);
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (visible) {
      done();
    }
  }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a");
      if (!link || !link.href || link.target === "_blank" || link.hasAttribute("download")) return;
      try {
        const url = new URL(link.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname) return;
        start();
      } catch {}
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [pathname]);

  useEffect(() => {
    const handler = () => start();
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(doneTimerRef.current);
      clearTimeout(timeoutTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
      <div
        className="h-full bg-primary transition-all duration-200 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}
