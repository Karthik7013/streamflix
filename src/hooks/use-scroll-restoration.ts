"use client";

import { useEffect, useRef } from "react";

const SCROLL_KEY = "explore-scroll";

function findScrollContainer(el: HTMLElement | null): HTMLElement | null {
  while (el) {
    const style = getComputedStyle(el);
    if (style.overflowY === "auto" || style.overflowY === "scroll") return el;
    el = el.parentElement;
  }
  return null;
}

function getMainElement(): HTMLElement | null {
  return document.querySelector("main");
}

export function useScrollRestoration() {
  const scrollRef = useRef<number>(0);
  const restoringRef = useRef(false);

  useEffect(() => {
    const el = findScrollContainer(getMainElement());
    if (!el) return;

    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      restoringRef.current = true;
      el.scrollTop = parseInt(saved, 10);
      restoringRef.current = false;
      sessionStorage.removeItem(SCROLL_KEY);
    }

    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!restoringRef.current) {
          scrollRef.current = el.scrollTop;
        }
      }, 300);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current));
    };
  }, []);
}
