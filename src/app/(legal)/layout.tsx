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
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
          <a href="/" className="text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity">
            StreamFlix
          </a>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
