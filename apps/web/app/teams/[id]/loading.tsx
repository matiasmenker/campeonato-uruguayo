const TeamDetailLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      {/* Header skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-6 p-6">
          <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100" />
          <div className="flex flex-col gap-3">
            <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 sm:grid-cols-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5 py-4">
              <div className="h-6 w-8 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-6 animate-pulse rounded bg-slate-50" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Squad skeleton */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-5 py-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent fixtures skeleton */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 animate-pulse rounded-full bg-slate-100" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-50" />
                </div>
                <div className="h-7 w-12 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  </main>
)

export default TeamDetailLoading
