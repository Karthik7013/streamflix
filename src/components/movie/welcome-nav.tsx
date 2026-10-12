import Link from "next/link";

export function WelcomeNav() {
  return (
    <nav className="relative z-20 flex h-16 w-full items-center justify-between px-7 md:h-20 md:px-16 bg-transparent">
      <Link href="/" className="flex items-center gap-2.5">
        <svg viewBox="0 0 100 100" className="size-6 shrink-0">
          <circle cx="50" cy="50" r="50" className="fill-primary" />
          <path d="M38 28 L74 50 L38 72 Z" className="fill-black" />
        </svg>
        <span className="text-sm font-bold tracking-[3px] text-primary">STREAMFLIX STUDIO</span>
      </Link>
    </nav>
  );
}
