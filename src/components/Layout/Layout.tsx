import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import { useAuth } from '../../hooks/useAuth'
import { MobileMenuProvider, useMobileMenu } from '../../context/MobileMenuContext'
import Login from '../../pages/Login'

function LayoutInner() {
  const { session, loading } = useAuth()
  const { open, close } = useMobileMenu()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-400">Carregando...</p>
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="flex min-h-screen bg-slate-100">
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={close} />}
      <Sidebar />
      <div className="flex-1 min-w-0 overflow-x-hidden pb-16 lg:pb-0">
        <Header />
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}

export default function Layout() {
  return (
    <MobileMenuProvider>
      <LayoutInner />
    </MobileMenuProvider>
  )
}
