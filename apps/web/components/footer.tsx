import Link from "next/link"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <p className="text-xs font-semibold text-slate-700">Campeonato Uruguayo</p>
            <span className="text-slate-200">·</span>
            <p className="text-xs text-slate-400">Unofficial · Not affiliated with AUF</p>
          </div>
          <p className="text-[11px] text-slate-400">Computer Science Project by Matias Menker</p>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/legal/disclaimer" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Disclaimer</Link>
          <Link href="/legal/privacy" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Terms</Link>
          <span className="text-slate-200">·</span>
          <p className="text-xs text-slate-300">© {currentYear}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
