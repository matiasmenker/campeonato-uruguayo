const PlayerDetailLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-56 animate-pulse bg-slate-200">
          <div className="absolute left-5 top-5 h-8 w-20 rounded-xl bg-slate-300" />
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-5 p-6">
            <div className="flex items-end gap-5">
              <div className="h-20 w-20 shrink-0 rounded-full bg-slate-300/60" />
              <div className="flex flex-col gap-2 pb-1">
                <div className="h-8 w-44 rounded bg-slate-300" />
                <div className="h-4 w-28 rounded bg-slate-300/60" />
                <div className="h-4 w-20 rounded bg-slate-300/40" />
              </div>
            </div>
            <div className="h-8 w-24 shrink-0 rounded-xl bg-slate-300" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-7 w-12 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 px-4 py-3 ${index < 4 ? "border-b border-slate-100" : ""}`}
              >
                <div className="h-3 w-8 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100 flex-1" />
                <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
)

export default PlayerDetailLoading
