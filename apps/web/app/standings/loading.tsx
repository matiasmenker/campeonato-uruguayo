const StandingsLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 animate-pulse bg-slate-200">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-300" />
              <div className="flex flex-col gap-2">
                <div className="h-7 w-20 rounded bg-slate-300" />
                <div className="h-4 w-44 rounded bg-slate-300/60" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="h-8 w-24 rounded-xl bg-slate-300" />
              <div className="h-8 w-28 rounded-xl bg-slate-300" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div className="h-3 w-6 animate-pulse rounded bg-slate-200" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-3 w-6 animate-pulse rounded bg-slate-200" />
            ))}
            <div className="h-3 w-8 animate-pulse rounded bg-slate-200" />
          </div>
          {Array.from({ length: 16 }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-1 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-4 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
              </div>
              {Array.from({ length: 8 }).map((_, colIndex) => (
                <div key={colIndex} className="h-3 w-6 animate-pulse rounded bg-slate-100" />
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-28 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </div>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center gap-4 p-4">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-200 ring-2 ring-slate-100" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-0.5 flex items-center gap-1">
                    <div className="h-3.5 w-3.5 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="h-7 w-8 animate-pulse rounded bg-slate-200" />
                  <div className="h-2.5 w-8 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  </main>
)

export default StandingsLoading
