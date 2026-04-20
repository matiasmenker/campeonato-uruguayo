const TermsPage = () => (
  <main className="min-h-svh bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-950">Terms of Use</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <p>
          This is a free, non-commercial, academic platform built as a university final-year
          project (TFG). There are no accounts, no payments, no subscriptions and no obligations
          of any kind for visitors.
        </p>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">Use</h2>
          <p>
            You are free to browse and consult the information on this site for personal,
            non-commercial purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">Intellectual property</h2>
          <p>
            Club names, crests and player images belong to their respective owners. No ownership
            over that content is claimed. The platform code is the original academic work of
            the author.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">Availability</h2>
          <p>
            The site is provided as-is with no uptime guarantees. It may be modified or taken
            offline at any time.
          </p>
        </section>
      </div>
    </div>
  </main>
)

export default TermsPage
