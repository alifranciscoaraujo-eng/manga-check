import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { TrendingUp, Trophy, Building2, Layers, Info, ChevronRight } from 'lucide-react'
import {
  getDashboardData, getExecucoesHoje, getUnidades, getSetores, getColaboradores,
  type DashboardData, type RankingItem,
} from '../lib/queries'
import type { Unidade, Setor, Colaborador, Execucao } from '../types'
import { pct, iniciais } from '../lib/format'
import { useAuth } from '../hooks/useAuth'
import ProgressBar from '../components/UI/ProgressBar'
import StatusDot from '../components/UI/StatusDot'

type Periodo = '7' | '30' | 'mes'

function intervalo(periodo: Periodo): { inicio: string; fim: string; label: string } {
  const hoje = new Date()
  const fim = hoje.toISOString().slice(0, 10)
  if (periodo === 'mes') {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return { inicio: ini.toISOString().slice(0, 10), fim, label: 'Este mês' }
  }
  const dias = periodo === '7' ? 6 : 29
  const ini = new Date(hoje)
  ini.setDate(ini.getDate() - dias)
  return { inicio: ini.toISOString().slice(0, 10), fim, label: periodo === '7' ? 'Últimos 7 dias' : 'Últimos 30 dias' }
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function Dashboard() {
  const { nome } = useAuth()
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [unidadeId, setUnidadeId] = useState('')
  const [setorId, setSetorId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')

  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [hoje, setHoje] = useState<Execucao[]>([])

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const { inicio, fim, label } = useMemo(() => intervalo(periodo), [periodo])

  useEffect(() => {
    Promise.all([getUnidades(), getSetores(), getColaboradores(), getExecucoesHoje()]).then(([u, s, c, h]) => {
      setUnidades(u as Unidade[]); setSetores(s as Setor[]); setColaboradores(c as Colaborador[]); setHoje(h)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    getDashboardData({ inicio, fim, unidade_id: unidadeId || undefined, setor_id: setorId || undefined, responsavel_id: responsavelId || undefined })
      .then(setData)
      .finally(() => setLoading(false))
  }, [inicio, fim, unidadeId, setorId, responsavelId])

  const m = data?.metricas
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const evolucaoChart = (data?.evolucao ?? []).map((d) => ({ ...d, label: `${d.data.slice(8, 10)}/${d.data.slice(5, 7)}` }))

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* Cabeçalho */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
          {saudacao()}, {nome?.split(' ')[0] || 'gestor'}
        </h1>
        <p className="text-sm text-slate-500 capitalize">{dataHoje}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select className="select-field w-auto" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          <option value="mes">Este mês</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
        <select className="select-field w-auto" value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
          <option value="">Todas as unidades</option>
          {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
        </select>
        <select className="select-field w-auto" value={setorId} onChange={(e) => setSetorId(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select className="select-field w-auto" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          <option value="">Todos os usuários</option>
          {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <KpiTotal value={m?.total ?? 0} />
        <KpiCard label="Não iniciado" value={m?.naoIniciado ?? 0} total={m?.total ?? 0} tone="neutral" />
        <KpiCard label="Iniciado, não finalizado" value={m?.emAndamento ?? 0} total={m?.total ?? 0} tone="amber" />
        <KpiCard label="Atrasado" value={m?.atrasado ?? 0} total={m?.total ?? 0} tone="red" />
        <KpiCard label="Finalizado" value={m?.finalizados ?? 0} total={m?.total ?? 0} tone="emerald" />
      </div>

      {/* Checklists do dia + Taxa de conclusão */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-5">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-slate-800">Checklists do dia</p>
            <button onClick={() => navigate('/meus-checklists')} className="text-sm font-medium text-emerald-600 flex items-center gap-0.5 hover:gap-1 transition-all">
              Ver todos <ChevronRight size={15} />
            </button>
          </div>
          {hoje.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Nenhum checklist agendado para hoje.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {hoje.slice(0, 7).map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.modelo_nome}</p>
                    <p className="text-xs text-slate-400 truncate">{e.responsavel_nome ?? '—'} · {e.unidade_nome ?? '—'}</p>
                  </div>
                  <div className="hidden sm:block w-28">
                    <ProgressBar value={e.percentual} tone={progressoTone(e.status)} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 w-9 text-right">{e.percentual}%</span>
                  <StatusDot status={e.status} size={22} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="font-semibold text-slate-800 mb-1">Taxa de conclusão</p>
          <p className="text-xs text-slate-400 mb-3">Finalização no período</p>
          <Donut value={m?.conclusao ?? 0} />
          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Finalizados</span>
              <span className="font-semibold text-slate-700">{m?.finalizados ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-slate-200" /> Pendentes</span>
              <span className="font-semibold text-slate-700">{(m?.total ?? 0) - (m?.finalizados ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <RankingCard titulo="Ranking por usuários" icon={Trophy} itens={data?.rankingUsuarios ?? []} avatar />
        <RankingCard titulo="Ranking por unidades" icon={Building2} itens={data?.rankingUnidades ?? []} />
        <RankingCard titulo="Ranking por setores" icon={Layers} itens={data?.rankingSetores ?? []} />
      </div>

      {/* Evolução */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-emerald-600" />
          <p className="font-semibold text-slate-800">Evolução dos indicadores</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">Pontualidade, esforço, qualidade e score por dia · {label}</p>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoChart} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="score" name="Score" stroke="#0f172a" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pontualidade" name="Pontualidade" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="esforco" name="Esforço" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="qualidade" name="Qualidade" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function progressoTone(status: Execucao['status']): 'emerald' | 'amber' | 'red' | 'slate' {
  return status === 'finalizado' ? 'emerald' : status === 'atrasado' ? 'red' : status === 'em_andamento' ? 'amber' : 'slate'
}

function KpiTotal({ value }: { value: number }) {
  return (
    <div className="card p-4 col-span-2 flex flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-800 border-transparent">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Agendados (total)</p>
      <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">{value.toLocaleString('pt-BR')}</p>
      <p className="text-xs text-slate-400 mt-1">checklists no período</p>
    </div>
  )
}

function KpiCard({ label, value, total, tone }: { label: string; value: number; total: number; tone: 'neutral' | 'amber' | 'red' | 'emerald' }) {
  const p = total ? Math.round((value / total) * 100) : 0
  const c = {
    neutral: { bg: 'bg-white', num: 'text-slate-800', pill: 'bg-slate-100 text-slate-500', bar: 'bg-slate-300', border: '' },
    amber: { bg: 'bg-amber-50', num: 'text-amber-600', pill: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', border: 'border-transparent' },
    red: { bg: 'bg-red-50', num: 'text-red-600', pill: 'bg-red-100 text-red-600', bar: 'bg-red-400', border: 'border-transparent' },
    emerald: { bg: 'bg-emerald-50', num: 'text-emerald-600', pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', border: 'border-transparent' },
  }[tone]
  return (
    <div className={`card p-4 ${c.bg} ${c.border} flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <p className="kpi-label leading-tight">{label}</p>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${c.pill}`}>{p}%</span>
      </div>
      <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 ${c.num}`}>{value.toLocaleString('pt-BR')}</p>
      <div className="mt-3 h-1 rounded-full bg-black/5 overflow-hidden">
        <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  )
}

function Donut({ value }: { value: number }) {
  const v = Math.round(value)
  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative w-36 h-36 rounded-full" style={{ background: `conic-gradient(#10b981 ${v * 3.6}deg, #eef2f6 0deg)` }}>
        <div className="absolute inset-[13px] bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-800">{v}%</span>
          <span className="text-xs text-slate-400">concluído</span>
        </div>
      </div>
    </div>
  )
}

function RankingCard({ titulo, icon: Icon, itens, avatar }: { titulo: string; icon: React.ElementType; itens: RankingItem[]; avatar?: boolean }) {
  const top = itens.slice(0, 4)
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-slate-400" />
        <p className="font-semibold text-slate-800 text-sm">{titulo}</p>
      </div>
      {top.length === 0 && <p className="text-sm text-slate-400 flex items-center gap-1.5"><Info size={14} /> Sem dados no período</p>}
      <div className="space-y-3">
        {top.map((it, i) => (
          <div key={it.nome}>
            <div className="flex items-center gap-2.5">
              <span className="w-5 text-xs font-bold text-slate-400 text-center">{i + 1}</span>
              {avatar && (
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">{iniciais(it.nome)}</span>
              )}
              <span className="flex-1 text-sm text-slate-700 truncate">{it.nome}</span>
              <span className="text-sm font-bold text-slate-800">{pct(it.score)}</span>
            </div>
            <div className="mt-1 pl-7"><ProgressBar value={it.score} /></div>
            <div className="flex items-center gap-3 mt-1 pl-7 text-[11px] text-slate-400">
              <span>P {pct(it.pontualidade)}</span>
              <span>Q {pct(it.qualidade)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
