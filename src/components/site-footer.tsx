import Link from "next/link";
import { FileText, Shield, AlertTriangle, Mail, Plus, Sparkles } from "lucide-react";
import { STATUS_PAGE_URL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} StreamFlix. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link href="/terms" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <FileText className="size-3.5" />
              Terms of Service
            </Link>
            <Link href="/changelog" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Sparkles className="size-3.5" />
              What&apos;s New
            </Link>
            <Link href="/privacy" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Shield className="size-3.5" />
              Privacy Policy
            </Link>
            <Link href="/dmca" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <AlertTriangle className="size-3.5" />
              DMCA
            </Link>
            <Link href="/requests" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Plus className="size-3.5" />
              Request Movie
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Mail className="size-3.5" />
              Contact
            </Link>
            <a
              href={STATUS_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              All Systems Operational
            </a>
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
