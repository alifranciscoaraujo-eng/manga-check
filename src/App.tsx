import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import MeusChecklists from './pages/MeusChecklists'
import ExecucaoChecklist from './pages/ExecucaoChecklist'
import Modelos from './pages/Modelos'
import Agendamentos from './pages/Agendamentos'
import Cadastros from './pages/Cadastros'
import NaoConformidades from './pages/NaoConformidades'

/** Rotas de gestão: funcionário (colaborador) é redirecionado para seus checklists. */
function RequireGestor({ children }: { children: React.ReactNode }) {
  const { isColaborador } = useAuth()
  if (isColaborador) return <Navigate to="/meus-checklists" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<RequireGestor><Dashboard /></RequireGestor>} />
            <Route path="meus-checklists" element={<MeusChecklists />} />
            <Route path="meus-checklists/:id" element={<ExecucaoChecklist />} />
            <Route path="modelos" element={<RequireGestor><Modelos /></RequireGestor>} />
            <Route path="agendamentos" element={<RequireGestor><Agendamentos /></RequireGestor>} />
            <Route path="cadastros" element={<RequireGestor><Cadastros /></RequireGestor>} />
            <Route path="nao-conformidades" element={<RequireGestor><NaoConformidades /></RequireGestor>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
