import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeft, MapPin, FolderOpen, User, Check, X, MinusCircle,
  Camera, Loader2, CheckCircle2,
} from 'lucide-react'
import clsx from 'clsx'
import {
  getExecucao, getRespostas, iniciarExecucao, updateResposta, updateExecucao,
  finalizarExecucao, uploadEvidencia,
} from '../lib/queries'
import type { Execucao, Resposta, StatusResposta } from '../types'
import { hhmm } from '../lib/format'
import ProgressBar from '../components/UI/ProgressBar'
import StatusBadge from '../components/UI/StatusBadge'

export default function ExecucaoChecklist() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { colaborador, isColaborador } = useAuth()
  const [exec, setExec] = useState<Execucao | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [loading, setLoading] = useState(true)
  const [finalizando, setFinalizando] = useState(false)

  const readOnly = exec?.status === 'finalizado'
  const initId = useRef<string | null>(null)

  const carregar = useCallback(async (execId: string) => {
    const e = await getExecucao(execId)
    setExec(e)
    const rs = e.status === 'finalizado' ? await getRespostas(e.id) : await iniciarExecucao(e)
    setRespostas(rs)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!id || initId.current === id) return
    initId.current = id
    carregar(id)
  }, [id, carregar])

  const total = respostas.length
  const respondidas = respostas.filter((r) => r.status).length
  const percentual = total ? Math.round((respondidas / total) * 100) : 0

  async function persistProgresso(novas: Resposta[]) {
    if (!exec) return
    const resp = novas.filter((r) => r.status).length
    const p = novas.length ? Math.round((resp / novas.length) * 100) : 0
    await updateExecucao(exec.id, { percentual: p })
  }

  async function setStatus(r: Resposta, status: StatusResposta) {
    if (readOnly) return
    const respondido_em = new Date().toISOString()
    const novas = respostas.map((x) => (x.id === r.id ? { ...x, status, respondido_em } : x))
    setRespostas(novas)
    await updateResposta(r.id, { status, respondido_em })
    await persistProgresso(novas)
  }

  async function setObservacao(r: Resposta, observacao: string) {
    const novas = respostas.map((x) => (x.id === r.id ? { ...x, observacao } : x))
    setRespostas(novas)
    await updateResposta(r.id, { observacao })
  }

  async function finalizar() {
    if (!exec) return
    setFinalizando(true)
    try {
      await finalizarExecucao(exec)
      navigate('/meus-checklists')
    } finally {
      setFinalizando(false)
    }
  }

  if (loading) return <div className="p-6 text-sm text-slate-400">Carregando checklist...</div>
  if (!exec) return <div className="p-6 text-sm text-slate-400">Checklist não encontrado.</div>
  // Funcionário só acessa as próprias execuções.
  if (isColaborador && colaborador && exec.responsavel_id && exec.responsavel_id !== colaborador.id) {
    return <Navigate to="/meus-checklists" replace />
  }

  const todasRespondidas = total > 0 && respondidas === total

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-28">
      <button onClick={() => navigate('/meus-checklists')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Cabeçalho da execução */}
      <div className="card p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">{hhmm(exec.horario_previsto)} · hoje</p>
            <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">{exec.modelo_nome}</h1>
          </div>
          <StatusBadge status={exec.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><FolderOpen size={13} /> {exec.setor_nome ?? '—'}</span>
          <span className="flex items-center gap-1"><MapPin size={13} /> {exec.unidade_nome ?? '—'}</span>
          <span className="flex items-center gap-1"><User size={13} /> {exec.responsavel_nome ?? '—'}</span>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Progresso</span>
            <span className="font-semibold text-slate-700">{respondidas}/{total} · {percentual}%</span>
          </div>
          <ProgressBar value={percentual} tone={percentual === 100 ? 'emerald' : 'amber'} />
        </div>
      </div>

      {/* Itens */}
      <div className="space-y-3">
        {respostas.map((r, i) => (
          <ItemCard key={r.id} r={r} index={i + 1} readOnly={readOnly} onStatus={setStatus} onObs={setObservacao} />
        ))}
      </div>

      {/* Rodapé fixo */}
      {!readOnly && (
        <div className="fixed bottom-0 lg:bottom-0 inset-x-0 lg:left-64 bg-white/95 backdrop-blur border-t border-slate-200 p-4 z-20">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {todasRespondidas ? 'Tudo pronto para finalizar' : `Faltam ${total - respondidas} ite${total - respondidas > 1 ? 'ns' : 'm'}`}
            </p>
            <button onClick={finalizar} disabled={!todasRespondidas || finalizando} className="btn-primary">
              {finalizando ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Finalizar checklist
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ItemCard({
  r, index, readOnly, onStatus, onObs,
}: {
  r: Resposta
  index: number
  readOnly: boolean
  onStatus: (r: Resposta, s: StatusResposta) => void
  onObs: (r: Resposta, v: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [fotoUrl, setFotoUrl] = useState(r.foto_url ?? null)

  async function handleFoto(file: File) {
    setUploading(true)
    try {
      const url = await uploadEvidencia(file)
      await updateResposta(r.id, { foto_url: url })
      setFotoUrl(url)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{index}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800">{r.item_descricao}</p>

          <div className="flex flex-wrap gap-2 mt-3">
            <StatusButton active={r.status === 'conforme'} onClick={() => onStatus(r, 'conforme')} disabled={readOnly} tone="emerald" icon={Check} label="Conforme" />
            <StatusButton active={r.status === 'nao_conforme'} onClick={() => onStatus(r, 'nao_conforme')} disabled={readOnly} tone="red" icon={X} label="Não conforme" />
            <StatusButton active={r.status === 'na'} onClick={() => onStatus(r, 'na')} disabled={readOnly} tone="slate" icon={MinusCircle} label="N/A" />
          </div>

          {r.exige_foto && (
            <div className="mt-3">
              {fotoUrl ? (
                <div className="flex items-center gap-2">
                  <img src={fotoUrl} alt="evidência" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                  {!readOnly && (
                    <button onClick={() => fileRef.current?.click()} className="text-xs text-slate-500 hover:text-emerald-600">Trocar foto</button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={readOnly || uploading}
                  className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 hover:bg-emerald-100 transition-colors disabled:opacity-60"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {uploading ? 'Enviando...' : 'Anexar foto de evidência'}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFoto(f) }}
              />
            </div>
          )}

          {!readOnly ? (
            <input
              className="input-field mt-3 text-sm"
              placeholder="Observação (opcional)"
              defaultValue={r.observacao ?? ''}
              onBlur={(e) => { if (e.target.value !== (r.observacao ?? '')) onObs(r, e.target.value) }}
            />
          ) : (
            r.observacao && <p className="text-xs text-slate-500 mt-2 italic">“{r.observacao}”</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusButton({
  active, onClick, disabled, tone, icon: Icon, label,
}: {
  active: boolean
  onClick: () => void
  disabled?: boolean
  tone: 'emerald' | 'red' | 'slate'
  icon: React.ElementType
  label: string
}) {
  const activeCls = {
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    red: 'bg-red-600 text-white border-red-600',
    slate: 'bg-slate-600 text-white border-slate-600',
  }[tone]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
        active ? activeCls : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
        disabled && !active && 'opacity-50 cursor-not-allowed',
      )}
    >
      <Icon size={13} /> {label}
    </button>
  )
}
