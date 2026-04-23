const PlayersLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-40 animate-pulse bg-slate-200">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="h-8 w-36 rounded bg-slate-300" />
            <div className="h-8 w-28 shrink-0 rounded-xl bg-slate-300" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
              <div className="h-3.5 w-24 animate-pulse rounded bg-slate-200" />
            </div>
            {Array.from({ length: 5 }).map((__, rowIndex) => (
              <div
                key={rowIndex}
                className={`flex items-center gap-3 px-4 py-2.5 ${rowIndex < 4 ? "border-b border-slate-100" : ""}`}
              >
                <div className="h-4 w-4 animate-pulse rounded bg-slate-100 text-center" />
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="h-3.5 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-5 w-10 animate-pulse rounded-full bg-slate-100 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>

    </div>
  </main>
)

export default PlayersLoading
