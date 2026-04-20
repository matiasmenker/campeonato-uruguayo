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
            endorsed by, or officially connected to the Asociación Uruguaya de Fútbol (AUF), any
            Uruguayan football club, or any official football body or data provider.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">2. Academic purpose</h2>
          <p>
            This platform was built exclusively as an academic final-year project
            (Trabajo Final de Grado — TFG) at a Uruguayan university. It is strictly
            non-commercial — it generates no revenue, carries no advertising, and is not
            offered as a product or service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">3. Club logos and player images</h2>
          <p>
            Club crests, logos and player images displayed on this site are the intellectual
            property of their respective football clubs and/or the Asociación Uruguaya de Fútbol
            (AUF). They are used solely for identification and informational purposes within
            the context of this academic project, with no commercial intent. No ownership or
            licence over such content is claimed or granted. If you are a rights holder and
            object to the display of any image, please contact us and it will be removed promptly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">4. Match and player statistics</h2>
          <p>
            Statistical data is sourced from SportMonks (sportmonks.com) under a valid API
            subscription agreement. Data is stored and transformed for display purposes in
            accordance with SportMonks' Terms of Service. SportMonks does not endorse this
            project.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">5. Video content</h2>
          <p>
            Videos displayed on this site are embedded from YouTube and are hosted and owned by
            AUFTV / AUF. This site does not host, store or reproduce any video files. Video
            embedding is performed through the official YouTube Data API v3 in compliance with
            Google's YouTube API Terms of Service. All video content remains © its respective
            copyright holders.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">6. Data accuracy</h2>
          <p>
            Data is updated on a periodic automated schedule and may not reflect real-time results.
            We do not guarantee the completeness, accuracy or timeliness of any data displayed.
            Do not rely on this data for betting, financial, or any other consequential
            decision-making.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">7. Limitation of liability</h2>
          <p>
            This platform is provided "as is" without any warranties of any kind. The author
            accepts no liability for any direct or indirect damages arising from the use of
            this site or reliance on its content.
          </p>
        </section>
      </div>
    </div>
  </main>
)

export default DisclaimerPage
