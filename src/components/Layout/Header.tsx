import { Menu, ClipboardCheck } from 'lucide-react'
import { useMobileMenu } from '../../context/MobileMenuContext'

export default function Header() {
  const { toggle } = useMobileMenu()
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-white border-b border-slate-200">
      <button
        onClick={toggle}
        className="text-slate-600 hover:text-slate-900 p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Menu size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <ClipboardCheck size={15} className="text-white" />
        </div>
        <span className="font-bold text-slate-800 tracking-tight">Manga Check</span>
      </div>
    </header>
  )
}
