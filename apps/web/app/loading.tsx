const PlayerCardSkeleton = () => (
  <div
    className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-sm"
    style={{ aspectRatio: "2.5/3.5" }}
  >
    <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-1 px-3 pt-3">
      <div className="h-2 w-14 animate-pulse rounded bg-slate-200" />
      <div className="h-2.5 w-10 animate-pulse rounded bg-slate-200" />
    </div>

    <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: 44, bottom: 50 }}>
      <div className="relative">
        <div className="h-[76px] w-[76px] animate-pulse rounded-full bg-slate-200" />
        <div
          className="absolute bottom-0 left-[-4px] h-6 w-6 animate-pulse rounded-full bg-slate-300"
          style={{ border: "2px solid #f8fafc" }}
        />
      </div>
    </div>

    <div className="absolute inset-x-0 bottom-0 flex h-12 items-center justify-between border-t border-slate-200 bg-white px-3">
      <div className="flex items-center gap-1">
        <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-3 w-7 animate-pulse rounded bg-slate-200" />
      </div>
      <div className="h-8 w-8 animate-pulse rounded bg-slate-100" />
    </div>
  </div>
)

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
            <div key={index} className="relative h-[188px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-100">
              <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
                  <div className="h-3.5 w-16 animate-pulse rounded bg-slate-200" />
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200" />
                  </div>
                  <div className="min-w-[96px] animate-pulse rounded-[22px] bg-slate-200 py-5" />
                  <div className="flex flex-row-reverse items-center gap-3">
                    <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
                <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
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
                <div key={index} className="overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
                  <div className="relative aspect-video w-full bg-slate-200">
                    <div className="absolute inset-0 animate-pulse bg-slate-300" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-slate-100 px-3 py-2.5">
                    <div className="h-3.5 flex-1 animate-pulse rounded bg-slate-200" />
                    <div className="h-3 w-12 shrink-0 animate-pulse rounded bg-slate-200" />
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
                <PlayerCardSkeleton key={index} />
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
