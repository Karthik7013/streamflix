export function PlayerSkeleton() {
  return (
    <div className="relative size-full bg-black overflow-hidden rounded-lg">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-emerald-500/[0.02]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="size-14 rounded-full border border-emerald-500/15 bg-emerald-500/[0.04] flex items-center justify-center animate-pulse">
          <div className="size-0 ml-0.5 border-y-[7px] border-y-transparent border-l-[12px] border-l-emerald-400/40" />
        </div>
      </div>

      <div className="absolute bottom-5 left-5 right-5">
        <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full w-1/4 bg-emerald-500/25 rounded-full animate-[shimmer-slide_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  )
}
