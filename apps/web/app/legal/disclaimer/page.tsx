const DisclaimerPage = () => (
  <main className="min-h-svh bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-950">Disclaimer</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 font-semibold text-slate-950">1. No affiliation</h2>
          <p>
            Campeonato Uruguayo is an independent, unofficial fan platform. It is not affiliated with,
            endorsed by, or connected to the Asociación Uruguaya de Fútbol (AUF), any Uruguayan
            football club, SportMonks, SofaScore, or any other official football body or data provider.
            All club names, crests, player names and likenesses are the intellectual property of their
            respective owners.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">2. Academic purpose</h2>
          <p>
            This platform was built exclusively as an academic final-year project (Trabajo Final de
            Grado — TFG). It is not a commercial product and does not generate revenue.
            Any resemblance to commercial services is unintentional.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">3. Data accuracy</h2>
          <p>
            Statistical data displayed on this site is sourced from third-party providers (SportMonks,
            SofaScore). We do not guarantee the completeness, accuracy or timeliness of any data.
            Data is updated on a periodic schedule and may not reflect real-time results.
            Do not rely on this data for betting, financial, or any other decision-making purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">4. Third-party content</h2>
          <p>
            Videos embedded on this platform are hosted on YouTube and belong to AUFTV / AUF. We do
            not host, reproduce or claim ownership of any video content. Embedding is done through
            YouTube's standard public API in compliance with YouTube's Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">5. Limitation of liability</h2>
          <p>
            This platform is provided "as is" without any warranties. The author accepts no liability
            for any direct or indirect damages arising from the use of this site or reliance on its
            content.
          </p>
        </section>
      </div>
    </div>
  </main>
)

export default DisclaimerPage
