const MatchesLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 animate-pulse bg-slate-800">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10" />
              <div className="flex flex-col gap-2">
                <div className="h-7 w-28 rounded bg-white/15" />
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

      <div className="flex flex-col gap-3">

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-14 py-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-100 px-4 py-2.5">
                <div className="h-3 w-12 animate-pulse rounded bg-slate-200" />
                <div className="h-2.5 w-10 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="relative h-[188px] overflow-hidden rounded-[28px] bg-slate-800">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700/60 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
                <div className="h-5 w-20 animate-pulse rounded-full bg-slate-700" />
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-700" />
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-700" />
                  </div>
                  <div className="flex h-12 min-w-[96px] animate-pulse items-center justify-center rounded-[22px] bg-slate-700/80" />
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-2.5 w-14 animate-pulse rounded bg-slate-700" />
                    <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-700" />
                  </div>
                </div>
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-700" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  </main>
)

export default MatchesLoading
