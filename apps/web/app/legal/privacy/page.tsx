const PrivacyPage = () => (
  <main className="min-h-svh bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-950">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 font-semibold text-slate-950">1. No personal data collected</h2>
          <p>
            Campeonato Uruguayo does not collect, store or process any personal data from visitors.
            There are no user accounts, no registration forms, and no login functionality.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">2. No cookies</h2>
          <p>
            This site does not use tracking cookies or any form of persistent browser storage
            for analytics or advertising purposes. A theme preference (light/dark) may be stored
            locally in your browser using <code className="rounded bg-slate-100 px-1">localStorage</code> — this
            data never leaves your device.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">3. Third-party services</h2>
          <p>
            This site embeds videos via the YouTube Data API (Google LLC). When you interact with
            embedded YouTube content, Google's own privacy policy and cookie policy apply.
            Statistical data is fetched server-side from SportMonks and SofaScore — your browser
            does not connect to these services directly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">4. Hosting</h2>
          <p>
            The site is hosted on Vercel (frontend) and Render (API). These providers may log
            standard server access logs (IP address, request path, timestamp) for operational
            purposes. These logs are governed by Vercel's and Render's respective privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">5. Contact</h2>
          <p>
            For any privacy-related questions, contact the project author through the university
            academic channels associated with this TFG.
          </p>
        </section>
      </div>
    </div>
  </main>
)

export default PrivacyPage
