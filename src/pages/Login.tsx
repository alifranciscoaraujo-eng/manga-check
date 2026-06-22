import { useState } from 'react'
import { ClipboardCheck, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn, signUp } = useAuth()

  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setAviso('')
    if (!email.trim() || !senha) { setErro('Informe e-mail e senha.'); return }
    if (modo === 'cadastro') {
      if (!nome.trim()) { setErro('Informe seu nome completo.'); return }
      if (senha.length < 6) { setErro('A senha deve ter no mínimo 6 caracteres.'); return }
      if (senha !== confirmar) { setErro('As senhas não conferem.'); return }
    }
    setCarregando(true)
    try {
      if (modo === 'login') {
        await signIn(email.trim(), senha)
      } else {
        const { needsConfirm } = await signUp(email.trim(), senha, nome.trim())
        if (needsConfirm) { setAviso('Conta criada! Confirme o e-mail para entrar.'); setModo('login') }
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? ''
      setErro(
        msg.includes('Invalid login credentials') ? 'E-mail ou senha incorretos.'
        : msg.includes('already registered') ? 'Este e-mail já está cadastrado.'
        : msg || 'Erro ao autenticar.',
      )
    } finally {
      setCarregando(false)
    }
  }

  function preencherDemo() {
    setModo('login'); setEmail('francisco@mangacheck.com'); setSenha('francisco123'); setErro(''); setAviso('')
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Painel de marca */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] xl:w-[40%] p-12 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-10 -left-16 w-72 h-72 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
            <ClipboardCheck size={22} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-lg tracking-tight">Manga Check</span>
        </div>

        <div className="relative">
          <h2 className="text-white text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Sua operação no padrão, todos os dias.
          </h2>
          <p className="text-emerald-50/80 mt-4 text-[15px] leading-relaxed max-w-sm">
            Checklists no celular da equipe, evidência em foto e indicadores em tempo real — para restaurantes, lanchonetes e afins.
          </p>
          <ul className="mt-8 space-y-3">
            {['Rotinas que rodam sozinhas', 'Prova de execução em foto', 'Pontualidade, qualidade e score'].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-emerald-50/90 text-sm">
                <CheckCircle2 size={18} className="text-white/90 shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-emerald-50/60 text-xs">Manga Check · Operação no padrão</p>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <ClipboardCheck size={22} className="text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800">Manga Check</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {modo === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 mb-7">
            {modo === 'login' ? 'Entre para acompanhar sua operação.' : 'Leva menos de um minuto.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{erro}</p>}
            {aviso && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">{aviso}</p>}

            {modo === 'cadastro' && (
              <div>
                <label className="label-field">Nome completo</label>
                <input className="input-field" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
            )}

            <div>
              <label className="label-field">E-mail</label>
              <input className="input-field" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="label-field">Senha</label>
              <div className="relative">
                <input
                  className="input-field pr-10"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button type="button" onClick={() => setMostrarSenha((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {modo === 'cadastro' && (
              <div>
                <label className="label-field">Confirmar senha</label>
                <input className="input-field" type={mostrarSenha ? 'text' : 'password'} placeholder="Repita a senha" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </div>
            )}

            <button type="submit" disabled={carregando} className="btn-primary w-full !py-3 group">
              {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
              {!carregando && <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">ou</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button type="button" onClick={preencherDemo} className="btn-secondary w-full">
            Entrar com conta de demonstração
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            {modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => { setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); setAviso('') }}
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              {modo === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
