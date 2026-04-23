const TeamDetailLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">

      <div className="overflow-hidden rounded-2xl shadow-lg">
        <div className="relative min-h-52 animate-pulse bg-slate-800">
          <div className="absolute left-5 top-5 h-8 w-20 rounded-xl bg-white/15" />
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-5 p-6">
            <div className="flex items-end gap-5">
              <div className="h-20 w-20 shrink-0 rounded-xl bg-white/10" />
              <div className="flex flex-col gap-2 pb-1">
                <div className="h-8 w-40 rounded bg-white/15" />
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="h-4 w-24 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-8 w-24 shrink-0 rounded-xl bg-white/15" />
          </div>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-3 lg:grid-cols-[1fr_340px]">

        <div className="flex items-center gap-2 px-1">
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="px-1">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="grid grid-cols-[28px_36px_1fr_56px_80px_44px] items-center border-b border-slate-100 px-4 py-2.5">
            <div className="h-3 w-4 animate-pulse rounded bg-slate-100" />
            <div />
            <div className="h-3 w-12 animate-pulse rounded bg-slate-100" />
            <div className="mx-auto h-3 w-8 animate-pulse rounded bg-slate-100" />
            <div className="mx-auto h-3 w-12 animate-pulse rounded bg-slate-100" />
            <div className="ml-auto h-3 w-8 animate-pulse rounded bg-slate-100" />
          </div>
          {[4, 5, 5, 4].map((rowCount, groupIndex) => (
            <div key={groupIndex}>
              <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-1.5">
                <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200" />
              </div>
              {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <div
                  key={rowIndex}
                  className={`grid grid-cols-[28px_36px_1fr_56px_80px_44px] items-center px-4 py-2 ${rowIndex < rowCount - 1 ? "border-b border-slate-100" : ""}`}
                >
                  <div className="h-3 w-4 animate-pulse rounded bg-slate-100" />
                  <div className="h-7 w-7 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="mx-auto h-[14px] w-[22px] animate-pulse rounded-[2px] bg-slate-100" />
                  <div className="mx-auto h-3 w-14 animate-pulse rounded bg-slate-100" />
                  <div className="ml-auto h-3 w-10 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1">
                <div className="h-6 w-14 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-20 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  </main>
)

export default TeamDetailLoading
