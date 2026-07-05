import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} StreamFlix. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/dmca" className="hover:text-foreground transition-colors">
              DMCA
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground/60 leading-relaxed max-w-2xl mx-auto">
          StreamFlix does not host any media files. Content is sourced from publicly available
          archives. All trademarks and copyrights belong to their respective owners.
        </p>
      </div>
    </footer>
  );
}
