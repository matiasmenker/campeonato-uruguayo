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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse rounded bg-slate-200" />
          <div>
            <div className="mb-1.5 h-5 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-3.5 w-36 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-200" />
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
