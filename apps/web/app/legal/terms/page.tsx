const TermsPage = () => (
  <main className="min-h-svh bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-950">Terms of Use</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 font-semibold text-slate-950">1. Acceptance</h2>
          <p>
            By accessing this website you agree to these Terms of Use. If you do not agree,
            please discontinue use immediately.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">2. Permitted use</h2>
          <p>
            This platform is provided for personal, non-commercial and educational use only.
            You may browse, view and share links to pages on this site. You may not scrape,
            reproduce, distribute or commercialise any content without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">3. Intellectual property</h2>
          <p>
            The source code of this project is the original academic work of the author.
            All football-related content (club names, crests, player images, statistics) remains
            the intellectual property of its respective rights holders (AUF, football clubs,
            data providers). No licence or ownership over that content is claimed or granted.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">4. Prohibited conduct</h2>
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc pl-5 flex flex-col gap-1">
            <li>Use this site for any commercial purpose</li>
            <li>Attempt to circumvent or disable any technical measures</li>
            <li>Automate access in a manner that places excessive load on the infrastructure</li>
            <li>Misrepresent this site as an official AUF or club product</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">5. Availability</h2>
          <p>
            This site is provided on a best-effort basis. We reserve the right to modify,
            suspend or discontinue it at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">6. Governing law</h2>
          <p>
            These terms are governed by the laws of Uruguay. Any disputes shall be subject to
            the exclusive jurisdiction of the courts of Montevideo, Uruguay.
          </p>
        </section>
      </div>
    </div>
  </main>
)

export default TermsPage
