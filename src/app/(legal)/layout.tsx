import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: {
    default: "StreamFlix",
    template: "%s | StreamFlix",
  },
};

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="size-4" />
              Back to StreamFlix
            </Link>
          </div>
          <Link href="/home" className="text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
            StreamFlix
          </Link>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
