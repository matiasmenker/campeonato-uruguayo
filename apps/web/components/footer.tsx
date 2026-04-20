import Link from "next/link"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 sm:grid-cols-3">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-slate-950">Campeonato Uruguayo</p>
            <p className="text-xs leading-relaxed text-slate-500">
              Unofficial fan statistics platform for the Uruguayan Primera División.
              Built as an academic project (TFG) — not affiliated with AUF or any club.
            </p>
          </div>

          {/* Legal links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Legal</p>
            <nav className="flex flex-col gap-2">
              <Link href="/legal/disclaimer" className="text-xs text-slate-500 hover:text-slate-950 transition-colors">Disclaimer</Link>
              <Link href="/legal/privacy" className="text-xs text-slate-500 hover:text-slate-950 transition-colors">Privacy Policy</Link>
              <Link href="/legal/terms" className="text-xs text-slate-500 hover:text-slate-950 transition-colors">Terms of Use</Link>
            </nav>
          </div>

          {/* Data sources */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Data sources</p>
            <div className="flex flex-col gap-2">
              <a href="https://www.sportmonks.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-950 transition-colors">SportMonks API</a>
              <a href="https://www.sofascore.com" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-950 transition-colors">SofaScore</a>
              <a href="https://www.auf.org.uy" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-slate-950 transition-colors">AUF (Asociación Uruguaya de Fútbol)</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6 text-center">
          <p className="text-xs text-slate-400">
            © {currentYear} Campeonato Uruguayo · For educational and academic use only ·
            All football data, trademarks and images belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
