const MatchDetailLoading = () => {
  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

        {/* Hero skeleton */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="relative min-h-52 bg-slate-800 animate-pulse">
            {/* Back button placeholder */}
            <div className="absolute left-5 top-5 h-9 w-20 rounded-xl bg-white/10" />
            {/* Badge placeholder */}
            <div className="absolute right-5 top-5 h-9 w-36 rounded-xl bg-white/10" />

            {/* Scoreboard skeleton */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-end justify-center gap-6">
                {/* Home team */}
                <div className="flex min-w-0 flex-1 flex-col items-end gap-2">
                  <div className="h-16 w-16 rounded-full bg-white/10" />
                  <div className="h-5 w-32 rounded bg-white/10" />
                </div>
                {/* Score */}
                <div className="flex shrink-0 flex-col items-center gap-2 pb-1">
                  <div className="h-12 w-28 rounded-lg bg-white/10" />
                  <div className="h-3 w-24 rounded bg-white/10" />
                  <div className="h-3 w-20 rounded bg-white/10" />
                </div>
                {/* Away team */}
                <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                  <div className="h-16 w-16 rounded-full bg-white/10" />
                  <div className="h-5 w-32 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pitch skeleton */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-14 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
          </div>
          <div
            className="w-full overflow-hidden rounded-2xl bg-slate-200 animate-pulse shadow-lg"
            style={{ aspectRatio: "16/9" }}
          />
        </div>

        {/* Events timeline skeleton */}
        <div className="flex flex-col gap-3">
          <div className="h-4 w-24 rounded bg-slate-200 animate-pulse px-1" />
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 shadow-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <div className="h-5 w-5 rounded bg-slate-100 animate-pulse" />
                <div className="h-3 w-8 rounded bg-slate-100 animate-pulse" />
                <div className="h-3 flex-1 rounded bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}

export default MatchDetailLoading
