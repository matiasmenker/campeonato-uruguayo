const HomeLoading = () => (
  <main className="bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:px-8 lg:px-10">

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
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

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">

        <div className="flex flex-col gap-8">

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl bg-slate-800 shadow-lg">
                  <div className="aspect-video w-full animate-pulse bg-slate-700" />
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="h-3.5 flex-1 animate-pulse rounded bg-slate-700" />
                    <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                  style={{ aspectRatio: "2.5/3.5" }}
                />
              ))}
            </div>
          </div>

        </div>

        <div className="flex h-full flex-col gap-8">

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                <div className="h-3 w-5 animate-pulse rounded bg-slate-200" />
                <div className="h-3 flex-1 animate-pulse rounded bg-slate-200" />
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-3 w-5 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 last:border-0">
                  <div className="h-3 w-4 animate-pulse rounded bg-slate-100" />
                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  </div>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-3 w-5 animate-pulse rounded bg-slate-100" />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
              <div className="grid grid-cols-[36px_1fr_1fr_48px] border-b border-slate-100 bg-slate-50 px-3 py-2">
                <div className="mx-auto h-3 w-4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
                <div className="mx-auto h-3 w-8 animate-pulse rounded bg-slate-200" />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="grid flex-1 grid-cols-[36px_1fr_1fr_48px] items-center border-b border-slate-100 px-3 py-1.5 last:border-0">
                  <div className="mx-auto h-3 w-4 animate-pulse rounded bg-slate-100" />
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="mx-auto h-4 w-5 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

    </div>
  </main>
)

export default HomeLoading
