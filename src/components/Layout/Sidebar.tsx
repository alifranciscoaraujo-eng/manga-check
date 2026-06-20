import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ListChecks, FileText, CalendarClock, Building2,
  ClipboardCheck, X, LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import { useMobileMenu } from '../../context/MobileMenuContext'
import { useAuth } from '../../hooks/useAuth'
import { iniciais } from '../../lib/format'

const navGestor = [
  { section: '', items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }] },
  {
    section: 'Operação',
    items: [{ label: 'Meus Checklists', href: '/meus-checklists', icon: ListChecks }],
  },
  {
    section: 'Configuração',
    items: [
      { label: 'Modelos', href: '/modelos', icon: FileText },
      { label: 'Agendamentos', href: '/agendamentos', icon: CalendarClock },
      { label: 'Cadastros', href: '/cadastros', icon: Building2 },
    ],
  },
]

const navColaborador = [
  { section: '', items: [{ label: 'Meus Checklists', href: '/meus-checklists', icon: ListChecks }] },
]

export default function Sidebar() {
  const location = useLocation()
  const { open, close } = useMobileMenu()
  const { nome, signOut, colaborador, isColaborador } = useAuth()
  const navStructure = isColaborador ? navColaborador : navGestor
  const papelLabel = isColaborador ? (colaborador?.funcao || 'Colaborador') : 'Gestor'

  return (
    <aside
      className={clsx(
        'bg-slate-900 flex flex-col overflow-y-auto shrink-0',
        'fixed inset-y-0 left-0 z-50 w-72',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:z-auto',
      )}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
              <ClipboardCheck size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-extrabold text-base leading-tight tracking-tight">Manga Check</p>
              <p className="text-slate-400 text-xs">Checklists Operacionais</p>
            </div>
          </div>
          <button
            onClick={close}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {navStructure.map((group) => (
          <div key={group.section} className="mb-2">
            {group.section && (
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 py-2 mt-2">
                {group.section}
              </p>
            )}
            {group.items.map((item) => (
              <SidebarItem key={item.href} item={item} currentPath={location.pathname} onNavigate={close} />
            ))}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {iniciais(nome)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{nome || 'Usuário'}</p>
            <p className="text-slate-500 text-xs">{papelLabel}</p>
          </div>
          <button
            onClick={() => signOut()}
            title="Sair"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

interface NavItem { label: string; href: string; icon: React.ElementType }

function SidebarItem({ item, currentPath, onNavigate }: { item: NavItem; currentPath: string; onNavigate: () => void }) {
  const isActive = item.href === '/' ? currentPath === '/' : currentPath.startsWith(item.href)
  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      className={clsx('sidebar-item', isActive ? 'sidebar-item-active' : 'sidebar-item-inactive')}
    >
      <item.icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
    </NavLink>
  )
}
