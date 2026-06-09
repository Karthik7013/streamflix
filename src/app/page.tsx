"use client"
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { ArrowRight, Loader2 } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Button } from "@/components/ui/button";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800']
});

const MOVIE_POSTERS = [
  "https://media-cache.cinematerial.com/p/500x/ctpnz4mq/interstellar-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/hua9fu5l/supergirl-latvian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/sikn4o3p/peddi-indian-movie-poster.jpg",
  "https://cdn.cinematerial.com/p/297x/wrilasnm/black-widow-movie-poster-md.jpg",
  "https://media-cache.cinematerial.com/p/500x/a9nltnsr/lucy-french-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/fvj5k53e/ray-gunn-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/nwu21mgo/evil-dead-burn-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/gc4ijscp/street-fighter-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/qmxnqgqr/the-paradise-indian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/ccvoqor3/the-odyssey-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/jcs0iccd/ramayana-part-1-indian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/bsqml1pb/couple-friendly-indian-movie-poster.jpg",
  "https://media-cache.cinematerial.com/p/500x/hgvfrmfu/the-odyssey-movie-poster.jpg"
]

const PosterCard = ({ url, i, priority }: { url: string; i: number; priority?: boolean }) => (
  <div key={i} className="relative aspect-2/3 w-full rounded-xl overflow-hidden border border-white/5 shadow-2xl transition-transform duration-500 bg-muted/20">
    <Image
      src={url}
      alt="Movie Poster"
      fill
      priority={priority}
      sizes="(max-width: 768px) 20vw, 10vw"
      className="object-cover opacity-80"
    />
    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
  </div>
);

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <div className={`${plusJakartaSans.className} relative min-h-screen w-full overflow-hidden bg-background text-foreground flex items-center justify-center`}>
      <style jsx global>{`
        @keyframes seamless-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .animate-infinite-scroll {
          animation: seamless-scroll 60s linear infinite;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-10 sm:opacity-90 perspective-distant">
        <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-35 rotate-z-20 skew-x-[-10deg]">
          {/* 
              We render 120 items (12 rows of 10). 
              The animation moves -50% (6 rows). 
              Since row 7 looks exactly like row 1, the reset is invisible.
          */}
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 sm:gap-3 p-4 animate-infinite-scroll">
            {[...Array(120)].map((_, i) => (
              <PosterCard
                key={i}
                url={MOVIE_POSTERS[i % MOVIE_POSTERS.length]}
                i={i}
                priority={i < 20} // Preload the first two rows to prevent flicker
              />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-background via-transparent via-20% to-background" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-transparent via-50% to-background" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center sm:items-start">
          <main className="flex flex-col gap-10 w-full max-w-2xl items-center sm:items-start">
            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={20}
              priority
            />
            <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
              <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-[-0.04em] text-foreground text-balance">
                Welcome to StreamFlix, your cinematic journey starts here.
              </h1>
              <p className="max-w-xl text-lg md:text-xl text-muted-foreground font-medium leading-relaxed text-balance">
                Dive into a vast library of films and series. Discover new releases, binge-watch classics, and find your next obsession.
              </p>
            </div>
            <div className="flex flex-col w-full sm:w-auto gap-4 font-medium sm:flex-row mt-4">
              <Button
                disabled={isPending}
                nativeButton={false}
                className="rounded-full text-sm sm:text-base h-12 px-8 shadow-lg"
                render={<Link href={session ? "/home" : "/login"} />}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {session ? " Continue" : "Get Started"}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
