import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Center glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="size-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Film strip top */}
        <div className="flex w-72 items-center gap-1.5 sm:w-80">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`top-${i}`} className="flex items-center gap-1.5 flex-1">
              <div className="size-3 shrink-0 rounded-full border-2 border-primary/20" />
              {i < 6 && <div className="h-4 flex-1 border-t-2 border-dashed border-primary/10" />}
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-sm" />
          <div className="relative rounded-2xl border border-primary/10 bg-card/30 px-8 py-12 backdrop-blur-sm">
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-8xl font-bold tracking-tighter text-primary">404</h1>
                <p className="text-lg font-medium text-foreground">Scene Not Found</p>
              </div>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                This scene was cut from the final edit. But the show must go on.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/home"
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-primary/30"
                >
                  Explore Movies
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Film strip bottom */}
        <div className="flex w-72 items-center gap-1.5 sm:w-80">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`bottom-${i}`} className="flex items-center gap-1.5 flex-1">
              <div className="size-3 shrink-0 rounded-full border-2 border-primary/20" />
              {i < 6 && <div className="h-4 flex-1 border-b-2 border-dashed border-primary/10" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
