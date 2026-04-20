const DisclaimerPage = () => (
  <main className="min-h-svh bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <h1 className="text-2xl font-bold text-slate-950">Disclaimer</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: April 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="mb-2 font-semibold text-slate-950">1. No affiliation</h2>
          <p>
            Campeonato Uruguayo is an independent, unofficial fan platform. It is not affiliated
            with, endorsed by, or officially connected to the Asociación Uruguaya de Fútbol (AUF)
            or any Uruguayan football club.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">2. Academic purpose</h2>
          <p>
            This platform was built exclusively as a non-commercial academic project
            (Trabajo Final de Grado — TFG). It generates no revenue and is not offered
            as a commercial product or service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">3. Intellectual property</h2>
          <p>
            All club names, crests, logos and player images remain the exclusive intellectual
            property of their respective owners — including football clubs and AUF. They are
            displayed solely for identification and informational purposes within the scope of
            this academic project, with no commercial intent whatsoever. No ownership or licence
            over such content is claimed or granted by this platform. If you are a rights holder
            and wish to request removal of any content, please contact us and it will be removed
            promptly.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">4. Video content</h2>
          <p>
            Videos shown on this site are embedded directly from YouTube via the official YouTube
            player. This platform does not host, download or store any video files. All video
            content is © its respective copyright holders. By watching embedded videos you are
            subject to YouTube's Terms of Service and Google's Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">5. Data accuracy</h2>
          <p>
            Statistical data is updated periodically and may not reflect real-time results.
            We do not guarantee the completeness, accuracy or timeliness of any information
            displayed. Do not rely on this data for betting, financial, or any other
            consequential decisions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-slate-950">6. Limitation of liability</h2>
          <p>
            This platform is provided "as is" without any warranties. The author accepts no
            liability for any direct or indirect damages arising from the use of this site or
            reliance on its content.
          </p>
        </section>
      </div>
    </div>
  </main>
)

export default DisclaimerPage
