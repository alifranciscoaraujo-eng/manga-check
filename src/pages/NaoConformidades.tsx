import { useEffect, useState, useMemo } from 'react'
import { AlertTriangle, Clock, CheckCircle2, XCircle, Eye, ChevronDown, X, Loader2, FileWarning } from 'lucide-react'
import clsx from 'clsx'
import { getNaoConformidades, updateNaoConformidade, getSetores, getColaboradores } from '../lib/queries'
import type { NaoConformidade, StatusNC, CriticidadeNC } from '../types'
import { ncStatusLabel, ncCriticidadeLabel, dataBR } from '../lib/format'
import type { Setor, Colaborador } from '../types'
import PageHeader from '../components/UI/PageHeader'
import KpiCard from '../components/UI/KpiCard'
import EmptyState from '../components/UI/EmptyState'
import Modal from '../components/UI/Modal'

// ── Badge helpers ──────────────────────────────────────────
const statusCor: Record<StatusNC, string> = {
  aberta:       'bg-red-50 text-red-700 border border-red-200',
  em_andamento: 'bg-amber-50 text-amber-700 border border-amber-200',
  vencida:      'bg-red-100 text-red-800 border border-red-300',
  concluida:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelada:    'bg-slate-100 text-slate-500 border border-slate-200',
}

const criticidadeCor: Record<CriticidadeNC, string> = {
  baixa:   'bg-slate-100 text-slate-600 border border-slate-200',
  media:   'bg-amber-50 text-amber-700 border border-amber-200',
  alta:    'bg-orange-50 text-orange-700 border border-orange-200',
  critica: 'bg-red-50 text-red-700 border border-red-200',
}

function NcBadge({ status }: { status: StatusNC }) {
  return <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', statusCor[status])}>{ncStatusLabel[status]}</span>
}

function CritBadge({ criticidade }: { criticidade: CriticidadeNC }) {
  return <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', criticidadeCor[criticidade])}>{ncCriticidadeLabel[criticidade]}</span>
}

// ── Detail Modal ───────────────────────────────────────────
function DetalheModal({ nc, onClose, onUpdate }: {
  nc: NaoConformidade
  onClose: () => void
  onUpdate: (updated: NaoConformidade) => void
}) {
  const [status, setStatus] = useState<StatusNC>(nc.status)
  const [tratativa, setTratativa] = useState(nc.tratativa ?? '')
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      const dataConclusao = status === 'concluida' ? new Date().toISOString().slice(0, 10) : nc.data_conclusao
      await updateNaoConformidade(nc.id, { status, tratativa: tratativa || null, data_conclusao: dataConclusao ?? null })
      onUpdate({ ...nc, status, tratativa: tratativa || null, data_conclusao: dataConclusao ?? null })
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  const statusOptions: StatusNC[] = ['aberta', 'em_andamento', 'concluida', 'cancelada']

  return (
    <Modal
      open
      onClose={onClose}
      title="Detalhes da Não Conformidade"
      maxWidth="max-w-xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Fechar</button>
          <button onClick={salvar} disabled={salvando} className="btn-primary">
            {salvando ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
            Salvar
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Cabeçalho NC */}
        <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800 leading-snug">{nc.titulo}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <NcBadge status={nc.status} />
              <CritBadge criticidade={nc.criticidade} />
            </div>
          </div>
        </div>

        {/* Origem */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Origem</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-xs text-slate-400">Checklist</dt><dd className="font-medium text-slate-800 truncate">{nc.modelo_nome ?? '—'}</dd></div>
            <div><dt className="text-xs text-slate-400">Data</dt><dd className="font-medium text-slate-800">{dataBR(nc.data_abertura)}</dd></div>
            <div><dt className="text-xs text-slate-400">Setor</dt><dd className="font-medium text-slate-800">{nc.setor_nome ?? '—'}</dd></div>
            <div><dt className="text-xs text-slate-400">Responsável</dt><dd className="font-medium text-slate-800 truncate">{nc.responsavel_nome ?? '—'}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-slate-400">Item do checklist</dt><dd className="font-medium text-slate-800">{nc.item_descricao ?? '—'}</dd></div>
          </dl>
        </div>

        {/* Foto */}
        {nc.foto_url && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Evidência fotográfica</p>
            <img src={nc.foto_url} alt="evidência" className="w-full max-w-xs rounded-xl border border-slate-200 object-cover" />
          </div>
        )}

        {/* Observação original */}
        {nc.observacao && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Observação registrada</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2.5 italic">"{nc.observacao}"</p>
          </div>
        )}

        {/* Prazo */}
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-slate-400" />
          <span className="text-slate-500">Prazo de correção:</span>
          <span className={clsx('font-semibold', nc.prazo_correcao && nc.prazo_correcao < new Date().toISOString().slice(0, 10) && nc.status !== 'concluida' ? 'text-red-600' : 'text-slate-700')}>
            {dataBR(nc.prazo_correcao)}
          </span>
        </div>

        {/* Tratativa */}
        <div>
          <label className="label-field">Tratativa / ação corretiva</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="Descreva a ação tomada para resolver esta não conformidade…"
            value={tratativa}
            onChange={(e) => setTratativa(e.target.value)}
          />
        </div>

        {/* Status */}
        <div>
          <label className="label-field">Alterar status</label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={clsx(
                  'flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                  status === s ? statusCor[s] : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50',
                )}
              >
                {ncStatusLabel[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Main page ──────────────────────────────────────────────
export default function NaoConformidades() {
  const [ncs, setNcs] = useState<NaoConformidade[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionada, setSelecionada] = useState<NaoConformidade | null>(null)

  // Filtros
  const [fStatus, setFStatus] = useState<StatusNC | ''>('')
  const [fCrit, setFCrit] = useState<CriticidadeNC | ''>('')
  const [fSetor, setFSetor] = useState('')
  const [fResp, setFResp] = useState('')
  const hoje = new Date()
  const [fInicio, setFInicio] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10))
  const [fFim, setFFim] = useState(hoje.toISOString().slice(0, 10))

  async function carregar() {
    setLoading(true)
    const [ns, s, c] = await Promise.all([
      getNaoConformidades({ inicio: fInicio, fim: fFim }),
      getSetores(),
      getColaboradores(),
    ])
    setNcs(ns)
    setSetores(s as Setor[])
    setColaboradores(c as Colaborador[])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [fInicio, fFim]) // eslint-disable-line

  const lista = useMemo(() => ncs.filter((n) => {
    if (fStatus && n.status !== fStatus) return false
    if (fCrit && n.criticidade !== fCrit) return false
    if (fSetor && n.setor_id !== fSetor) return false
    if (fResp && n.responsavel_id !== fResp) return false
    return true
  }), [ncs, fStatus, fCrit, fSetor, fResp])

  const abertas   = ncs.filter(n => n.status === 'aberta').length
  const criticas  = ncs.filter(n => n.criticidade === 'critica' || n.criticidade === 'alta').length
  const vencidas  = ncs.filter(n => n.status === 'vencida' || (n.status === 'aberta' && n.prazo_correcao && n.prazo_correcao < hoje.toISOString().slice(0, 10))).length
  const concluidas = ncs.filter(n => n.status === 'concluida').length

  function handleUpdate(updated: NaoConformidade) {
    setNcs(prev => prev.map(n => n.id === updated.id ? updated : n))
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1200px] mx-auto">
      <PageHeader title="Não Conformidades" subtitle="Falhas identificadas nos checklists e seu status de tratativa" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Abertas" value={abertas} icon={AlertTriangle} tone="red" subtitle="aguardando ação" />
        <KpiCard label="Alta criticidade" value={criticas} icon={XCircle} tone="amber" subtitle="alta + crítica" />
        <KpiCard label="Prazo vencido" value={vencidas} icon={Clock} tone="red" subtitle="vencidas" />
        <KpiCard label="Concluídas" value={concluidas} icon={CheckCircle2} tone="emerald" subtitle="no período" />
      </div>

      {/* Filtros */}
      <div className="card p-3.5 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="input-field w-auto" value={fInicio} onChange={e => setFInicio(e.target.value)} />
          <span className="text-slate-400 text-sm">até</span>
          <input type="date" className="input-field w-auto" value={fFim} onChange={e => setFFim(e.target.value)} />

          <div className="relative">
            <select className="select-field w-auto pr-8" value={fStatus} onChange={e => setFStatus(e.target.value as StatusNC | '')}>
              <option value="">Todos os status</option>
              {(['aberta','em_andamento','vencida','concluida','cancelada'] as StatusNC[]).map(s => (
                <option key={s} value={s}>{ncStatusLabel[s]}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select className="select-field w-auto pr-8" value={fCrit} onChange={e => setFCrit(e.target.value as CriticidadeNC | '')}>
              <option value="">Todas as criticidades</option>
              {(['baixa','media','alta','critica'] as CriticidadeNC[]).map(c => (
                <option key={c} value={c}>{ncCriticidadeLabel[c]}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <select className="select-field w-auto" value={fSetor} onChange={e => setFSetor(e.target.value)}>
            <option value="">Todos os setores</option>
            {setores.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>

          <select className="select-field w-auto" value={fResp} onChange={e => setFResp(e.target.value)}>
            <option value="">Toda a equipe</option>
            {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>

          {(fStatus || fCrit || fSetor || fResp) && (
            <button onClick={() => { setFStatus(''); setFCrit(''); setFSetor(''); setFResp('') }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 px-2">
              <X size={14} /> Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="card p-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader2 size={18} className="animate-spin" /> Carregando...
        </div>
      ) : lista.length === 0 ? (
        <div className="card">
          <EmptyState icon={FileWarning} title="Nenhuma não conformidade encontrada" description="Ajuste os filtros ou o período para ver os registros." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="table-header rounded-tl-2xl">Título / Item</th>
                  <th className="table-header hidden md:table-cell">Checklist</th>
                  <th className="table-header hidden lg:table-cell">Setor</th>
                  <th className="table-header hidden sm:table-cell">Responsável</th>
                  <th className="table-header hidden sm:table-cell">Data</th>
                  <th className="table-header">Criticidade</th>
                  <th className="table-header">Status</th>
                  <th className="table-header rounded-tr-2xl"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lista.map((nc) => (
                  <tr key={nc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="table-cell max-w-[180px]">
                      <p className="font-medium text-slate-800 truncate">{nc.titulo}</p>
                      {nc.item_descricao && nc.item_descricao !== nc.titulo && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{nc.item_descricao}</p>
                      )}
                    </td>
                    <td className="table-cell hidden md:table-cell text-slate-500 max-w-[140px] truncate">{nc.modelo_nome ?? '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-slate-500">{nc.setor_nome ?? '—'}</td>
                    <td className="table-cell hidden sm:table-cell text-slate-500 max-w-[120px] truncate">{nc.responsavel_nome ?? '—'}</td>
                    <td className="table-cell hidden sm:table-cell text-slate-500 whitespace-nowrap">{dataBR(nc.data_abertura)}</td>
                    <td className="table-cell"><CritBadge criticidade={nc.criticidade} /></td>
                    <td className="table-cell"><NcBadge status={nc.status} /></td>
                    <td className="table-cell">
                      <button
                        onClick={() => setSelecionada(nc)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-400">
            {lista.length} registro{lista.length !== 1 ? 's' : ''} encontrado{lista.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {selecionada && (
        <DetalheModal
          nc={selecionada}
          onClose={() => setSelecionada(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
