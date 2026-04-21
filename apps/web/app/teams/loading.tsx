const TeamsLoading = () => (
  <main className="min-h-svh bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_48%,#eef2f7_100%)]">
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-pulse rounded bg-slate-200" />
        <div className="flex flex-col gap-1.5">
          <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 22 }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="h-14 w-14 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  </main>
)

export default TeamsLoading
