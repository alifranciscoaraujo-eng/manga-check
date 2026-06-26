import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  TrendingUp, AlertTriangle, CheckCircle2, Clock, FileDown,
  BarChart2, Layers, ShieldAlert, Loader2,
} from 'lucide-react'
import { getDashboardData, getNcStats, getSetores, getColaboradores, type DashboardData, type NcStats } from '../lib/queries'
import type { Setor, Colaborador } from '../types'
import { pct } from '../lib/format'
import { gerarRelatorioPdf } from '../lib/gerarPdf'
import KpiCard from '../components/UI/KpiCard'
import PageHeader from '../components/UI/PageHeader'
import EmptyState from '../components/UI/EmptyState'

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

const NC_STATUS_COLORS: Record<string, string> = {
  aberta: '#ef4444',
  em_andamento: '#f59e0b',
  vencida: '#dc2626',
  concluida: '#10b981',
  cancelada: '#94a3b8',
}

function alertas(dash: DashboardData, nc: NcStats, label: string): string[] {
  const avisos: string[] = []
  const score = Math.round(dash.metricas.score)
  if (score < 70) avisos.push(`Score de conformidade em ${score}% (abaixo de 70%). Revisar processos operacionais.`)
  if (nc.criticas > 0) avisos.push(`${nc.criticas} NC${nc.criticas > 1 ? 's' : ''} de alta criticidade em aberto. Ação imediata necessária.`)
  if (nc.vencidas > 0) avisos.push(`${nc.vencidas} NC${nc.vencidas > 1 ? 's' : ''} com prazo vencido. Regularizar imediatamente.`)
  if (nc.porSetor[0]) avisos.push(`Setor "${nc.porSetor[0].nome}" concentra o maior número de NCs no período.`)
  if (dash.metricas.atrasado > 0) avisos.push(`${dash.metricas.atrasado} checklist${dash.metricas.atrasado > 1 ? 's' : ''} atrasado${dash.metricas.atrasado > 1 ? 's' : ''} em ${label}.`)
  if (avisos.length === 0) avisos.push('Nenhum alerta crítico identificado no período. Operação dentro do padrão.')
  return avisos
}

export default function PainelExecutivo() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [setorId, setSetorId] = useState('')
  const [responsavelId, setResponsavelId] = useState('')
  const [setores, setSetores] = useState<Setor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [dash, setDash] = useState<DashboardData | null>(null)
  const [nc, setNc] = useState<NcStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const { inicio, fim, label } = useMemo(() => intervalo(periodo), [periodo])

  useEffect(() => {
    Promise.all([getSetores(), getColaboradores()]).then(([s, c]) => {
      setSetores(s as Setor[]); setColaboradores(c as Colaborador[])
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    const filtros = { inicio, fim, setor_id: setorId || undefined, responsavel_id: responsavelId || undefined }
    Promise.all([getDashboardData(filtros), getNcStats(filtros)])
      .then(([d, n]) => { setDash(d); setNc(n) })
      .finally(() => setLoading(false))
  }, [inicio, fim, setorId, responsavelId])

  const m = dash?.metricas
  const evolucaoChart = (dash?.evolucao ?? []).map(d => ({
    ...d, label: `${d.data.slice(8, 10)}/${d.data.slice(5, 7)}`,
  }))

  async function exportarPdf() {
    if (!dash || !nc) return
    setGerandoPdf(true)
    try {
      const setorNome = setorId ? setores.find(s => s.id === setorId)?.nome : undefined
      const respNome = responsavelId ? colaboradores.find(c => c.id === responsavelId)?.nome : undefined
      gerarRelatorioPdf({
        periodo: label,
        setor: setorNome,
        responsavel: respNome,
        metricas: dash.metricas,
        ncStats: nc,
        evolucao: dash.evolucao,
      })
    } finally {
      setGerandoPdf(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Painel Executivo"
        subtitle="Visão gerencial da conformidade, rotinas executadas e não conformidades identificadas"
        action={
          <button onClick={exportarPdf} disabled={gerandoPdf || loading} className="btn-secondary">
            {gerandoPdf ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}
            Gerar relatório PDF
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <select className="select-field w-auto" value={periodo} onChange={e => setPeriodo(e.target.value as Periodo)}>
          <option value="mes">Este mês</option>
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
        </select>
        <select className="select-field w-auto" value={setorId} onChange={e => setSetorId(e.target.value)}>
          <option value="">Todos os setores</option>
          {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <select className="select-field w-auto" value={responsavelId} onChange={e => setResponsavelId(e.target.value)}>
          <option value="">Toda a equipe</option>
          {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin" /> Carregando painel...
        </div>
      ) : (
        <>
          {/* KPIs — linha 1: checklists */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard label="Score geral" value={pct(m?.score ?? 0)} tone="dark" icon={BarChart2} subtitle={`${label}`} />
            <KpiCard label="Checklists realizados" value={m?.total ?? 0} tone="slate" icon={CheckCircle2} subtitle={`${Math.round(m?.conclusao ?? 0)}% concluídos`} />
            <KpiCard label="Pontualidade" value={pct(m?.pontualidade ?? 0)} tone="emerald" icon={Clock} subtitle="no prazo" />
            <KpiCard label="Qualidade" value={pct(m?.qualidade ?? 0)} tone="blue" icon={Layers} subtitle="itens conformes" />
          </div>

          {/* KPIs — linha 2: NCs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <KpiCard label="NCs abertas" value={nc?.abertas ?? 0} tone={nc?.abertas ? 'red' : 'slate'} icon={AlertTriangle} subtitle="aguardando tratativa" />
            <KpiCard label="Alta criticidade" value={nc?.criticas ?? 0} tone={nc?.criticas ? 'amber' : 'slate'} icon={ShieldAlert} subtitle="alta + crítica" />
            <KpiCard label="Prazo vencido" value={nc?.vencidas ?? 0} tone={nc?.vencidas ? 'red' : 'slate'} icon={Clock} subtitle="sem resolução" />
            <KpiCard label="NCs concluídas" value={nc?.concluidas ?? 0} tone="emerald" icon={CheckCircle2} subtitle="resolvidas" />
          </div>

          {/* Alertas executivos */}
          {dash && nc && (
            <div className="card p-4 mb-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-amber-500" /> Alertas executivos
              </p>
              <div className="space-y-2">
                {alertas(dash, nc, label).map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 text-sm rounded-xl px-3.5 py-2.5 ${
                    a.startsWith('Nenhum') ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                  }`}>
                    <span className="shrink-0 mt-0.5">{a.startsWith('Nenhum') ? '✓' : '⚠'}</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evolução */}
          <div className="card p-5 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-emerald-600" />
              <p className="font-semibold text-slate-800">Evolução da conformidade</p>
            </div>
            <p className="text-xs text-slate-400 mb-4">Score, pontualidade e qualidade por dia · {label}</p>
            <div className="h-64">
              {evolucaoChart.length === 0 ? (
                <EmptyState icon={TrendingUp} title="Sem dados de evolução" description="Não há dados suficientes para o período selecionado." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucaoChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
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

          {/* NC por setor + NC por status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
            {/* Bar NC por setor */}
            <div className="card p-5">
              <p className="font-semibold text-slate-800 mb-1">NCs por setor</p>
              <p className="text-xs text-slate-400 mb-4">Concentração de não conformidades por área</p>
              <div className="h-52">
                {!nc?.porSetor.length ? (
                  <EmptyState icon={BarChart2} title="Sem NCs no período" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nc.porSetor} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="count" name="NCs" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie NC por status */}
            <div className="card p-5">
              <p className="font-semibold text-slate-800 mb-1">Distribuição por status</p>
              <p className="text-xs text-slate-400 mb-4">Situação atual das não conformidades</p>
              <div className="h-52">
                {!nc?.porStatus.length ? (
                  <EmptyState icon={AlertTriangle} title="Sem NCs no período" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nc.porStatus}
                        dataKey="count"
                        nameKey="label"
                        cx="40%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={44}
                        paddingAngle={2}
                      >
                        {nc.porStatus.map((entry) => (
                          <Cell key={entry.status} fill={NC_STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v, n) => [v, n]} />
                      <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top 5 itens mais não conformes */}
          {nc && nc.topItens.length > 0 && (
            <div className="card p-5 mb-5">
              <p className="font-semibold text-slate-800 mb-1">Top 5 itens mais não conformes</p>
              <p className="text-xs text-slate-400 mb-4">Itens com maior incidência de falhas no período</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={nc.topItens.map(it => ({ ...it, nome: it.descricao.length > 40 ? it.descricao.slice(0, 40) + '…' : it.descricao }))}
                    margin={{ top: 0, right: 20, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={160} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="count" name="Ocorrências" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Ranking setores (do dashboard) */}
          {dash && dash.rankingSetores.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={16} className="text-slate-400" />
                <p className="font-semibold text-slate-800 text-sm">Desempenho por setor</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 rounded-xl">
                      <th className="table-header">#</th>
                      <th className="table-header">Setor</th>
                      <th className="table-header text-right">Score</th>
                      <th className="table-header text-right">Pontualidade</th>
                      <th className="table-header text-right">Qualidade</th>
                      <th className="table-header text-right">Finalizados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dash.rankingSetores.map((r, i) => (
                      <tr key={r.nome} className="hover:bg-slate-50/70">
                        <td className="table-cell text-slate-400 font-bold">{i + 1}</td>
                        <td className="table-cell font-medium text-slate-800">{r.nome}</td>
                        <td className="table-cell text-right font-bold text-slate-800">{pct(r.score)}</td>
                        <td className="table-cell text-right text-slate-600">{pct(r.pontualidade)}</td>
                        <td className="table-cell text-right text-slate-600">{pct(r.qualidade)}</td>
                        <td className="table-cell text-right text-slate-600">{r.finalizados}/{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
