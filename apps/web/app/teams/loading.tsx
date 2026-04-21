const TeamsLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      {/* Hero skeleton */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-44 animate-pulse bg-slate-800">
          {/* "All teams" button placeholder */}
          <div className="absolute left-5 top-5 h-9 w-28 rounded-xl bg-white/10" />
          {/* Season selector placeholder */}
          <div className="absolute right-5 top-5 h-9 w-32 rounded-xl bg-white/10" />
          {/* Title area */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-5 p-6">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/10" />
            <div className="flex flex-col gap-2 pb-1">
              <div className="h-7 w-24 rounded bg-white/15" />
              <div className="h-4 w-44 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Team cards grid skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 18 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="h-14 w-14 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

    </div>
  </main>
)

export default TeamsLoading
