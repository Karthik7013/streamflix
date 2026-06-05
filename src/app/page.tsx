"use client"
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

type CardConfig = {
  variant: "gradient" | "skeleton" | "empty";
  className?: string;
  content?: React.ReactNode;
};

const rows: CardConfig[][] = [
  [
    {
      variant: "gradient",
      className: "bg-linear-to-br from-indigo-500 to-purple-600 border-white/10",
      content: (
        <>
          <h3 className="text-xl font-bold tracking-tight text-white">New Releases</h3>
          <div className="h-4 w-2/3 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <>
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-zinc-700 rounded-md" />
            <div className="h-4 w-full bg-zinc-800 rounded-md" />
            <div className="h-4 w-5/6 bg-zinc-800 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-tr from-emerald-500 to-teal-600 border-white/10",
      content: (
        <>
          <h3 className="text-xl font-bold tracking-tight text-white">Trending</h3>
          <div className="h-12 w-12 bg-white/20 rounded-full" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <div className="h-full w-full bg-zinc-800/50 rounded-md animate-pulse" />
      ),
    },
    {
      variant: "empty",
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-blue-600 to-cyan-500 border-white/10",
      content: <div className="h-4 w-1/2 bg-white/20 rounded-md" />,
    },
  ],
  [
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-4 w-3/4 bg-zinc-800 rounded-md" />
          <div className="h-20 w-full bg-zinc-800/40 border border-zinc-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-pink-500 to-rose-600 border-white/10",
      content: (
        <>
          <p className="text-sm font-medium opacity-90">Watch Anywhere</p>
          <div className="h-4 w-1/2 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "empty",
    },
    {
      variant: "skeleton",
      content: (
        <div className="space-y-2">
          <div className="h-4 w-full bg-zinc-800 rounded-md" />
          <div className="h-4 w-2/3 bg-zinc-800 rounded-md" />
        </div>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-tr from-purple-600 to-indigo-600 border-white/10",
      content: <h3 className="text-lg font-bold text-white">Originals</h3>,
    },
    {
      variant: "skeleton",
      content: (
        <div className="h-12 w-12 bg-zinc-800 rounded-full mx-auto" />
      ),
    },
  ],
  [
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-10 w-10 bg-zinc-800 rounded-lg" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-zinc-800 rounded-md" />
            <div className="h-3 w-4/5 bg-zinc-800 rounded-md" />
          </div>
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-amber-500 to-orange-600 border-white/10",
      content: (
        <>
          <h3 className="text-xl font-bold tracking-tight text-white">Award Winning</h3>
          <div className="h-4 w-1/3 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-4 w-full bg-zinc-800 rounded-md" />
          <div className="h-8 w-full bg-zinc-800 rounded-md" />
        </>
      ),
    },
    {
      variant: "empty",
    },
    {
      variant: "skeleton",
      content: <div className="h-full w-full bg-zinc-800 rounded-md" />,
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-lime-500 to-emerald-600 border-white/10",
      content: <div className="h-4 w-full bg-white/20 rounded-md" />,
    },
  ],
  [
    {
      variant: "skeleton",
      content: (
        <>
          <div className="h-4 w-3/4 bg-zinc-800 rounded-md" />
          <div className="h-20 w-full bg-zinc-800/40 border border-zinc-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-violet-500 to-fuchsia-600 border-white/10",
      content: (
        <>
          <h3 className="text-xl font-bold tracking-tight text-white">Top Rated</h3>
          <div className="h-4 w-1/3 bg-white/20 rounded-md" />
        </>
      ),
    },
    {
      variant: "skeleton",
      content: (
        <>
          <div className="space-y-3">
            <div className="h-4 w-1/3 bg-zinc-700 rounded-md" />
            <div className="h-4 w-full bg-zinc-800 rounded-md" />
            <div className="h-4 w-5/6 bg-zinc-800 rounded-md" />
          </div>
          <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
        </>
      ),
    },
    {
      variant: "empty",
    },
    {
      variant: "gradient",
      className: "bg-linear-to-br from-red-600 to-orange-600 border-white/10",
      content: <h3 className="text-lg font-bold text-white">Action</h3>,
    },
    {
      variant: "skeleton",
      content: (
        <div className="h-4 w-full bg-zinc-800 rounded-md" />
      ),
    },
  ],
];

function renderCard(card: CardConfig, i: number) {
  const base = "aspect-[2/3] w-full rounded-xl p-4 shadow-2xl flex flex-col justify-between border transition-transform duration-500";

  if (card.variant === "empty") {
    return (
      <div key={i} className="aspect-[2/3] w-full rounded-xl bg-zinc-900 p-4 shadow-2xl border border-zinc-800 flex items-center justify-center">
        <div className="w-full h-full border-2 border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-zinc-700 font-mono text-sm">
          Empty Slot
        </div>
      </div>
    );
  }

  if (card.variant === "skeleton") {
    return (
      <div key={i} className={`${base} bg-zinc-900 border-zinc-800`}>
        {card.content}
      </div>
    );
  }

  return (
    <div key={i} className={`${base} ${card.className}`}>
      {card.content}
    </div>
  );
}

function renderRow(row: CardConfig[], i: number) {
  return (
    <div key={i} className="grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-6">
      {row.map((card, j) => renderCard(card, j))}
    </div>
  );
}

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 text-white flex items-center justify-center">

      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-30 sm:opacity-40 perspective-[1200px]">

        <div className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] origin-center transform rotate-x-[35deg] rotate-z-[20deg] skew-x-[-10deg]">

          <div className="flex flex-col gap-8 p-4 animate-scroll-bg">
            {[...Array(3)].map((_, setIdx) =>
              rows.map((row, rowIdx) => renderRow(row, setIdx * rows.length + rowIdx))
            )}
          </div>
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-transparent via-20% to-zinc-950" />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950 via-transparent via-50% to-zinc-950" />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center sm:items-start font-sans">
          <main className="flex flex-col gap-10 w-full max-w-2xl items-center sm:items-start">
            <Image
              className="dark:invert mb-4"
              src="/next.svg"
              alt="Next.js logo"
              width={100}
              height={20}
              priority
            />
            <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tighter text-white">
                Welcome to StreamFlix, your cinematic journey starts here.
              </h1>
              <p className="max-w-lg text-lg md:text-xl text-slate-400 leading-relaxed">
                Dive into a vast library of films and series. Discover new releases, binge-watch classics, and find your next obsession.
              </p>
            </div>
            <div className="flex flex-col w-full sm:w-auto gap-4 font-medium sm:flex-row mt-4">
              <Link
                href={session ? "/home" : "/login"}
                className="rounded-full transition-all flex items-center justify-center bg-white text-black font-semibold gap-2 hover:bg-slate-200 text-sm sm:text-base h-12 px-8 shadow-lg active:scale-95"
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {session ? " Continue to Dashboard" : "Get Started"}
              </Link>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
