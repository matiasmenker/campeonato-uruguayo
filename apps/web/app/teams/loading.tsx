const TeamsLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 animate-pulse bg-slate-200">
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-300" />
              <div className="flex flex-col gap-2">
                <div className="h-7 w-24 rounded bg-slate-300" />
                <div className="h-4 w-48 rounded bg-slate-300/60" />
              </div>
            </div>
            <div className="h-8 w-24 shrink-0 rounded-xl bg-slate-300" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="h-14 w-14 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>

    </div>
  </main>
)

export default TeamsLoading
