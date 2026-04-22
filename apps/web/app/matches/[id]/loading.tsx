const MatchDetailLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 animate-pulse bg-slate-800">
          {/* Back button — top left */}
          <div className="absolute left-5 top-5 h-8 w-20 rounded-xl bg-white/15" />

          {/* Bottom — score centered, badge bottom-right */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="relative">
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
              {/* Stage/round badge — bottom right */}
              <div className="absolute bottom-0 right-0 h-8 w-36 rounded-xl bg-white/15" />
            </div>
          </div>
        </div>
      </div>

      {/* Pitch skeleton */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
        </div>
        <div
          className="w-full animate-pulse overflow-hidden rounded-2xl bg-slate-200 shadow-lg"
          style={{ aspectRatio: "16/9" }}
        />
      </div>

      {/* Events timeline skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 px-1" />
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-slate-100 py-2 last:border-0">
              <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-8 animate-pulse rounded bg-slate-100" />
              <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

    </div>
  </main>
)

export default MatchDetailLoading
