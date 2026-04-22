const TableSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
    <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-4 py-3">
      {[10, 40, 8, 8, 8, 8, 8, 8, 8, 10].map((width, index) => (
        <div key={index} className="h-3 animate-pulse rounded bg-slate-200" style={{ width: `${width}%` }} />
      ))}
    </div>
    {Array.from({ length: 16 }).map((_, index) => (
      <div key={index} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3.5 last:border-0">
        <div className="h-3 w-[10%] animate-pulse rounded bg-slate-100" />
        <div className="flex flex-1 items-center gap-3">
          <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
        </div>
        {Array.from({ length: 8 }).map((_, colIndex) => (
          <div key={colIndex} className="h-3 w-[6%] animate-pulse rounded bg-slate-100" />
        ))}
      </div>
    ))}
  </div>
)

const StatCardSkeleton = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
    <div className="mb-3 h-3 w-24 animate-pulse rounded bg-slate-100" />
    <div className="h-6 w-36 animate-pulse rounded bg-slate-100" />
  </div>
)

const StandingsLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 animate-pulse bg-slate-800">
          {/* Bottom — title left, selectors right */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10" />
              <div className="flex flex-col gap-2">
                <div className="h-7 w-20 rounded bg-white/15" />
                <div className="h-4 w-44 rounded bg-white/10" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-8 w-24 rounded-xl bg-white/15" />
              <div className="h-8 w-28 rounded-xl bg-white/15" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <TableSkeleton />
        <div className="flex flex-col gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    </div>
  </main>
)

export default StandingsLoading
