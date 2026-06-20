import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Colaborador } from '../types'

interface AuthContextType {
  session: Session | null
  colaborador: Colaborador | null
  isColaborador: boolean
  nome: string
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nome: string) => Promise<{ needsConfirm: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchColaborador(session: Session | null): Promise<Colaborador | null> {
  if (!session?.user) return null
  const { data: porUser } = await supabase
    .from('mc_colaboradores').select('*').eq('user_id', session.user.id).maybeSingle()
  if (porUser) return porUser as Colaborador
  if (session.user.email) {
    const { data: porEmail } = await supabase
      .from('mc_colaboradores').select('*').eq('email', session.user.email).maybeSingle()
    if (porEmail) return porEmail as Colaborador
  }
  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function carregar(s: Session | null) {
      const col = await fetchColaborador(s)
      if (!active) return
      setColaborador(col)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      carregar(data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(true)
      carregar(s)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, nome: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })
    if (error) throw error
    return { needsConfirm: !data.session }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isColaborador = colaborador?.papel === 'colaborador'
  const nome =
    colaborador?.nome ??
    (session?.user?.user_metadata?.nome as string | undefined) ??
    session?.user?.email?.split('@')[0] ??
    ''

  return (
    <AuthContext.Provider value={{ session, colaborador, isColaborador, nome, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
