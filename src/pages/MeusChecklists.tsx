import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { getExecucoesHoje, getColaboradores } from '../lib/queries'
import type { Execucao, Colaborador } from '../types'
import { hhmm } from '../lib/format'
import { useAuth } from '../hooks/useAuth'
import ProgressBar from '../components/UI/ProgressBar'
import StatusDot from '../components/UI/StatusDot'

function progressoTone(status: Execucao['status']): 'emerald' | 'amber' | 'red' | 'slate' {
  return status === 'finalizado' ? 'emerald' : status === 'atrasado' ? 'red' : status === 'em_andamento' ? 'amber' : 'slate'
}

export default function MeusChecklists() {
  const navigate = useNavigate()
  const { colaborador, isColaborador } = useAuth()
  const [execucoes, setExecucoes] = useState<Execucao[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [responsavelId, setResponsavelId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getExecucoesHoje(), getColaboradores()])
      .then(([ex, c]) => {
        setExecucoes(ex)
        setColaboradores(c as Colaborador[])
      })
      .finally(() => setLoading(false))
  }, [])

  // Funcionário enxerga apenas os próprios checklists.
  useEffect(() => {
    if (isColaborador && colaborador) setResponsavelId(colaborador.id)
  }, [isColaborador, colaborador])

  const lista = useMemo(
    () => (responsavelId ? execucoes.filter((e) => e.responsavel_id === responsavelId) : execucoes),
    [execucoes, responsavelId],
  )

  const concluidos = lista.filter((e) => e.status === 'finalizado').length
  const atrasados = lista.filter((e) => e.status === 'atrasado').length
  const dataHoje = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Meus Checklists</h1>
          <p className="text-sm text-slate-500">Tarefas do dia, na ordem e no horário certo</p>
        </div>
        {!isColaborador && (
          <select className="select-field w-auto" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
            <option value="">Toda a equipe</option>
            {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        )}
      </div>

      {/* Resumo do dia */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Calendar size={16} className="text-emerald-600" />
            <span className="uppercase text-sm">Hoje · {dataHoje}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={15} /> {concluidos} de {lista.length} concluídos</span>
            {atrasados > 0 && <span className="flex items-center gap-1.5 text-red-600"><AlertTriangle size={15} /> {atrasados} atrasado{atrasados > 1 ? 's' : ''}</span>}
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={lista.length ? (concluidos / lista.length) * 100 : 0} />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Carregando...</p>
      ) : lista.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Nenhum checklist agendado para hoje.</div>
      ) : (
        <div className="space-y-2.5">
          {lista.map((ex) => (
            <ChecklistCard key={ex.id} ex={ex} onOpen={() => navigate(`/meus-checklists/${ex.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChecklistCard({ ex, onOpen }: { ex: Execucao; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="card w-full text-left p-3.5 sm:p-4 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-3.5 group">
      <div className="w-12 text-center shrink-0">
        <p className={`text-base font-extrabold leading-none ${ex.status === 'atrasado' ? 'text-red-600' : 'text-slate-800'}`}>{hhmm(ex.horario_previsto)}</p>
        <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-1">hoje</p>
      </div>
      <div className="w-px self-stretch bg-slate-100" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 leading-tight truncate">{ex.modelo_nome}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {[ex.setor_nome, ex.unidade_nome, ex.responsavel_nome].filter(Boolean).join(' · ')}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <ProgressBar value={ex.percentual} tone={progressoTone(ex.status)} className="flex-1 max-w-[220px]" />
          <span className="text-xs font-semibold text-slate-500 w-9">{ex.percentual}%</span>
        </div>
      </div>
      <StatusDot status={ex.status} size={26} />
      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-400 shrink-0" />
    </button>
  )
}
