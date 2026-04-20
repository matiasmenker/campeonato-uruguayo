import Link from "next/link"

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">

        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-slate-950">Campeonato Uruguayo</p>
          <p className="text-xs text-slate-400">
            Unofficial fan platform · Academic project (TFG) · Not affiliated with AUF
          </p>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/legal/disclaimer" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Disclaimer</Link>
          <Link href="/legal/privacy" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Privacy</Link>
          <Link href="/legal/terms" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">Terms</Link>
        </div>

      </div>
      <div className="border-t border-slate-100">
        <p className="px-6 py-3 text-center text-xs text-slate-300 sm:px-8 lg:px-10">
          © {currentYear} Campeonato Uruguayo · All trademarks and images belong to their respective owners
        </p>
      </div>
    </footer>
  )
}

export default Footer
