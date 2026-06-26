import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, Trophy, Layers, Clock, Info, ChevronRight,
  Store, Gauge, AlertTriangle, CheckCircle2, ShieldAlert,
  FileDown, Loader2,
} from 'lucide-react'
import {
  getDashboardData, getNcStats, getExecucoesHoje,
  getUnidades, getSetores, getColaboradores,
  type DashboardData, type RankingItem, type NcStats,
} from '../lib/queries'
import type { Unidade, Setor, Colaborador, Execucao } from '../types'
import { pct, iniciais, hhmm } from '../lib/format'
import { useAuth } from '../hooks/useAuth'
import { gerarRelatorioPdf } from '../lib/gerarPdf'
import ProgressBar from '../components/UI/ProgressBar'
import StatusDot from '../components/UI/StatusDot'
import KpiCard from '../components/UI/KpiCard'

type Periodo = '7' | '30' | 'mes'

function intervalo(p: Periodo) {
  const hoje = new Date()
  const fim = hoje.toISOString().slice(0, 10)
  if (p === 'mes') {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    return { inicio: ini.toISOString().slice(0, 10), fim, label: 'Este mês' }
  }
  const dias = p === '7' ? 6 : 29
  const ini = new Date(hoje); ini.setDate(ini.getDate() - dias)
  return { inicio: ini.toISOString().slice(0, 10), fim, label: p === '7' ? 'Últimos 7 dias' : 'Últimos 30 dias' }
}

function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function progressoTone(status: Execucao['status']): 'emerald' | 'amber' | 'red' | 'slate' {
  return status === 'finalizado' ? 'emerald' : status === 'atrasado' ? 'red' : status === 'em_andamento' ? 'amber' : 'slate'
}

const NC_STATUS_COLORS: Record<string, string> = {
  aberta: '#ef4444', em_andamento: '#f59e0b',
  vencida: '#dc2626', concluida: '#10b981', cancelada: '#94a3b8',
}

function gerarAlertas(dash: DashboardData, nc: NcStats, label: string): { msg: string; ok: boolean }[] {
  const avisos: { msg: string; ok: boolean }[] = []
  const score = Math.round(dash.metricas.score)
  if (nc.criticas > 0) avisos.push({ msg: `${nc.criticas} NC${nc.criticas > 1 ? 's' : ''} de alta criticidade em aberto. Ação imediata necessária.`, ok: false })
  if (nc.vencidas > 0) avisos.push({ msg: `${nc.vencidas} NC${nc.vencidas > 1 ? 's' : ''} com prazo vencido sem resolução.`, ok: false })
  if (score < 70) avisos.push({ msg: `Score ${score}% abaixo do padrão recomendado (70%). Revisar processos.`, ok: false })
  if (dash.metricas.atrasado > 0) avisos.push({ msg: `${dash.metricas.atrasado} checklist${dash.metricas.atrasado > 1 ? 's' : ''} atrasado${dash.metricas.atrasado > 1 ? 's' : ''} no período de ${label}.`, ok: false })
  if (nc.porSetor[0]) avisos.push({ msg: `Setor "${nc.porSetor[0].nome}" concentra o maior número de NCs.`, ok: false })
  if (avisos.length === 0) avisos.push({ msg: 'Nenhum alerta crítico. Operação dentro do padrão.', ok: true })
  return avisos
}

export default function Dashboard() {
  const { nome } = useAuth()
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [setorId, setSetorId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')

  const [empresa, setEmpresa] = useState('')
  const [setores, setSetores] = useState<Setor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [hoje, setHoje] = useState<Execucao[]>([])

  const [data, setData] = useState<DashboardData | null>(null)
  const [nc, setNc] = useState<NcStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const { inicio, fim, label } = useMemo(() => intervalo(periodo), [periodo])

  useEffect(() => {
    Promise.all([getUnidades(), getSetores(), getColaboradores(), getExecucoesHoje()])
      .then(([u, s, c, h]) => {
        setEmpresa(((u as Unidade[])[0]?.nome) ?? '')
        setSetores(s as Setor[]); setColaboradores(c as Colaborador[]); setHoje(h)
      })
  }, [])

  useEffect(() => {
    setLoading(true)
    const filtros = { inicio, fim, setor_id: setorId || undefined, responsavel_id: responsavelId || undefined }
    Promise.all([getDashboardData(filtros), getNcStats(filtros)])
      .then(([d, n]) => { setData(d); setNc(n) })
      .finally(() => setLoading(false))
  }, [inicio, fim, setorId, responsavelId])

  const m = data?.metricas
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const concluidosHoje = hoje.filter((e) => e.status === 'finalizado').length
  const evolucaoChart = (data?.evolucao ?? []).map((d) => ({ ...d, label: `${d.data.slice(8, 10)}/${d.data.slice(5, 7)}` }))

  async function exportarPdf() {
    if (!data || !nc) return
    setGerandoPdf(true)
    try {
      const setorNome = setorId ? setores.find(s => s.id === setorId)?.nome : undefined
      const respNome = responsavelId ? colaboradores.find(c => c.id === responsavelId)?.nome : undefined
      gerarRelatorioPdf({ periodo: label, setor: setorNome, responsavel: respNome, metricas: data.metricas, ncStats: nc, evolucao: data.evolucao })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">

      {/* ── Cabeçalho ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">
            {saudacao()}, {nome?.split(' ')[0] || 'gestor'}
          </h1>
          <p className="text-sm text-slate-500 flex items-center flex-wrap gap-x-2">
            <span className="capitalize">{dataHoje}</span>
            {empresa && <><span className="text-slate-300">•</span><span className="font-medium text-slate-600 inline-flex items-center gap-1"><Store size={13} /> {empresa}</span></>}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <Gauge size={18} className="text-emerald-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 leading-none">Score geral</p>
              <p className="text-lg font-extrabold text-slate-800 leading-tight">{pct(m?.score ?? 0)}</p>
            </div>
          </div>
          <button onClick={exportarPdf} disabled={gerandoPdf || loading} className="btn-secondary">
            {gerandoPdf ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            Relatório PDF
          </button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select className="select-field w-auto" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          <option value="mes">Este mês</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
        <select className="select-field w-auto" value={setorId} onChange={(e) => setSetorId(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select className="select-field w-auto" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
          <option value="">Toda a equipe</option>
          {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* ── KPIs Checklists ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <KpiCard label="Agendados" value={m?.total ?? 0} tone="dark" subtitle="no período" className="col-span-2 lg:col-span-1" />
        <KpiCard label="Não iniciado" value={m?.naoIniciado ?? 0}
          subtitle={m?.total ? `${Math.round((m.naoIniciado / m.total) * 100)}%` : '—'} tone="slate" />
        <KpiCard label="Em andamento" value={m?.emAndamento ?? 0}
          subtitle={m?.total ? `${Math.round((m.emAndamento / m.total) * 100)}%` : '—'} tone="amber" />
        <KpiCard label="Atrasado" value={m?.atrasado ?? 0}
          subtitle={m?.total ? `${Math.round((m.atrasado / m.total) * 100)}%` : '—'} tone={m?.atrasado ? 'red' : 'slate'} />
        <KpiCard label="Finalizado" value={m?.finalizados ?? 0}
          subtitle={m?.total ? `${Math.round((m.finalizados ?? 0 / m.total) * 100)}%` : '—'} tone="emerald" />
      </div>

      {/* ── Checklists do dia + Taxa de conclusão ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-slate-800">Checklists do dia</p>
              <p className="text-xs text-slate-400">{concluidosHoje} de {hoje.length} concluídos</p>
            </div>
            <button onClick={() => navigate('/meus-checklists')} className="text-sm font-medium text-emerald-600 flex items-center gap-0.5 hover:gap-1 transition-all">
              Ver todos <ChevronRight size={15} />
            </button>
          </div>
          {hoje.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">Nenhum checklist agendado para hoje.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {hoje.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className="text-xs font-bold text-slate-700 w-10 shrink-0">{hhmm(e.horario_previsto)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.modelo_nome}</p>
                    <p className="text-xs text-slate-400 truncate">{e.setor_nome ?? '—'} · {e.responsavel_nome ?? '—'}</p>
                  </div>
                  <div className="hidden sm:block w-24">
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

      {/* ── KPIs Não Conformidades ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="NCs abertas" value={nc?.abertas ?? 0} icon={AlertTriangle} tone={nc?.abertas ? 'red' : 'slate'} subtitle="aguardando tratativa" />
        <KpiCard label="Alta criticidade" value={nc?.criticas ?? 0} icon={ShieldAlert} tone={nc?.criticas ? 'amber' : 'slate'} subtitle="alta + crítica" />
        <KpiCard label="Prazo vencido" value={nc?.vencidas ?? 0} icon={Clock} tone={nc?.vencidas ? 'red' : 'slate'} subtitle="sem resolução" />
        <KpiCard label="NCs concluídas" value={nc?.concluidas ?? 0} icon={CheckCircle2} tone="emerald" subtitle="resolvidas" />
      </div>

      {/* ── Alertas executivos ── */}
      {data && nc && (
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500" /> Alertas
          </p>
          <div className="space-y-1.5">
            {gerarAlertas(data, nc, label).map((a, i) => (
              <div key={i} className={`flex items-start gap-2.5 text-sm rounded-xl px-3.5 py-2.5 ${a.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
                <span className="shrink-0 mt-0.5">{a.ok ? '✓' : '⚠'}</span>
                <span>{a.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Evolução ── */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={16} className="text-emerald-600" />
          <p className="font-semibold text-slate-800">Evolução dos indicadores</p>
        </div>
        <p className="text-xs text-slate-400 mb-4">Pontualidade, qualidade e score por dia · {label}</p>
        <div className="h-64">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400"><Loader2 size={18} className="animate-spin mr-2" /> Carregando...</div>
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
                <Line type="monotone" dataKey="qualidade" name="Qualidade" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── NC por setor + NC por status ── */}
      {nc && (nc.porSetor.length > 0 || nc.porStatus.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {nc.porSetor.length > 0 && (
            <div className="card p-5">
              <p className="font-semibold text-slate-800 mb-1">NCs por setor</p>
              <p className="text-xs text-slate-400 mb-4">Concentração de falhas por área</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nc.porSetor} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="count" name="NCs" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {nc.porStatus.length > 0 && (
            <div className="card p-5">
              <p className="font-semibold text-slate-800 mb-1">NCs por status</p>
              <p className="text-xs text-slate-400 mb-4">Situação atual das não conformidades</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={nc.porStatus} dataKey="count" nameKey="label" cx="40%" cy="50%" outerRadius={72} innerRadius={38} paddingAngle={2}>
                      {nc.porStatus.map((entry) => (
                        <Cell key={entry.status} fill={NC_STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Top 5 itens mais não conformes ── */}
      {nc && nc.topItens.length > 0 && (
        <div className="card p-5 mb-4">
          <p className="font-semibold text-slate-800 mb-1">Top 5 itens mais não conformes</p>
          <p className="text-xs text-slate-400 mb-4">Itens com maior incidência de falhas no período</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={nc.topItens.map(it => ({ ...it, nome: it.descricao.length > 45 ? it.descricao.slice(0, 45) + '…' : it.descricao }))}
                margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={170} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" name="Ocorrências" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Rankings ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RankingCard titulo="Ranking da equipe" icon={Trophy} itens={data?.rankingUsuarios ?? []} avatar />
        <RankingCard titulo="Desempenho por setor" icon={Layers} itens={data?.rankingSetores ?? []} />
        <RankingCard titulo="Desempenho por turno" icon={Clock} itens={data?.rankingTurnos ?? []} />
      </div>

    </div>
  )
}

// ── Sub-componentes ────────────────────────────────────────
function Donut({ value }: { value: number }) {
  const v = Math.round(value)
  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative w-32 h-32 rounded-full" style={{ background: `conic-gradient(#10b981 ${v * 3.6}deg, #eef2f6 0deg)` }}>
        <div className="absolute inset-[12px] bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-800">{v}%</span>
          <span className="text-[10px] text-slate-400">concluído</span>
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


