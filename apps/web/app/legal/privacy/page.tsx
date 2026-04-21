const PrivacyPage = () => (
  <main className="min-h-svh bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-950">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <p>
          This platform does not collect any personal data. There are no accounts,
          no registration, no login, and no contact forms.
        </p>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">Cookies</h2>
          <p>
            No tracking or advertising cookies are used. The only data stored locally
            in your browser is your light/dark theme preference — it never leaves your device.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">Embedded videos</h2>
          <p>
            Videos are embedded via YouTube&apos;s official player. When a page with embedded
            videos loads, YouTube may set its own cookies subject to{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-950"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  </main>
)

export default PrivacyPage
