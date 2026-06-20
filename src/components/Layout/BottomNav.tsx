import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, ListChecks, CalendarClock, Building2 } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../../hooks/useAuth'

const itemsGestor = [
  { label: 'Início', href: '/', icon: LayoutDashboard },
  { label: 'Checklists', href: '/meus-checklists', icon: ListChecks },
  { label: 'Agenda', href: '/agendamentos', icon: CalendarClock },
  { label: 'Cadastros', href: '/cadastros', icon: Building2 },
]

const itemsColaborador = [
  { label: 'Meus Checklists', href: '/meus-checklists', icon: ListChecks },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const { isColaborador } = useAuth()
  const items = isColaborador ? itemsColaborador : itemsGestor
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex">
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors',
              active ? 'text-emerald-600' : 'text-slate-400',
            )}
          >
            <item.icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
