import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  ArrowLeft, MapPin, FolderOpen, User, Check, X, MinusCircle,
  Camera, Loader2, CheckCircle2, AlertTriangle, ListChecks, ChevronRight, Trash2, Plus,
} from 'lucide-react'
import clsx from 'clsx'
import {
  getExecucao, getRespostas, iniciarExecucao, updateResposta, updateExecucao,
  finalizarExecucao, uploadEvidencia, gerarNcSeNaoConforme,
  getFotosPorRespostas, addFotoResposta, deleteFotoResposta,
} from '../lib/queries'
import type { Execucao, Resposta, RespostaFoto, StatusResposta } from '../types'
import { hhmm } from '../lib/format'
import ProgressBar from '../components/UI/ProgressBar'
import StatusBadge from '../components/UI/StatusBadge'

export default function ExecucaoChecklist() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { colaborador, isColaborador } = useAuth()
  const [exec, setExec] = useState<Execucao | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [fotosMap, setFotosMap] = useState<Record<string, RespostaFoto[]>>({})
  const [loading, setLoading] = useState(true)
  const [finalizando, setFinalizando] = useState(false)
  const [ncCount, setNcCount] = useState<number | null>(null)

  const readOnly = exec?.status === 'finalizado'
  const initId = useRef<string | null>(null)

  const carregar = useCallback(async (execId: string) => {
    try {
      const e = await getExecucao(execId)
      setExec(e)
      const rs = e.status === 'finalizado' ? await getRespostas(e.id) : await iniciarExecucao(e)
      setRespostas(rs)
      const ids = rs.map((r) => r.id)
      const fotos = await getFotosPorRespostas(ids)
      setFotosMap(fotos)
    } catch {
      navigate('/meus-checklists', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [navigate])

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
    if (readOnly || !exec) return
    const respondido_em = new Date().toISOString()
    const atualizada: Resposta = { ...r, status, respondido_em }
    const novas = respostas.map((x) => (x.id === r.id ? atualizada : x))
    setRespostas(novas)
    await updateResposta(r.id, { status, respondido_em })
    await persistProgresso(novas)
    if (status === 'nao_conforme') {
      await gerarNcSeNaoConforme(atualizada, exec)
    }
  }

  async function setObservacao(r: Resposta, observacao: string) {
    const novas = respostas.map((x) => (x.id === r.id ? { ...x, observacao } : x))
    setRespostas(novas)
    await updateResposta(r.id, { observacao })
  }

  async function handleAddFoto(r: Resposta, file: File) {
    const url = await uploadEvidencia(file)
    const nova = await addFotoResposta(r.id, url)
    setFotosMap((prev) => {
      const arr = [...(prev[r.id] ?? []), nova]
      // Sync foto_url (first photo) to the resposta for NC backward-compat
      updateResposta(r.id, { foto_url: arr[0].url })
      return { ...prev, [r.id]: arr }
    })
  }

  async function handleDeleteFoto(r: Resposta, fotoId: string) {
    await deleteFotoResposta(fotoId)
    setFotosMap((prev) => {
      const arr = (prev[r.id] ?? []).filter((f) => f.id !== fotoId)
      updateResposta(r.id, { foto_url: arr[0]?.url ?? null })
      return { ...prev, [r.id]: arr }
    })
  }

  async function finalizar() {
    if (!exec) return
    setFinalizando(true)
    try {
      await finalizarExecucao(exec)
      const count = respostas.filter((r) => r.status === 'nao_conforme').length
      setNcCount(count)
      setExec((prev) => prev ? { ...prev, status: 'finalizado' } : prev)
    } finally {
      setFinalizando(false)
    }
  }

  if (loading) return <div className="p-6 text-sm text-slate-400">Carregando checklist...</div>
  if (!exec) return <div className="p-6 text-sm text-slate-400">Checklist não encontrado.</div>
  if (isColaborador && colaborador && exec.responsavel_id && exec.responsavel_id !== colaborador.id) {
    return <Navigate to="/meus-checklists" replace />
  }

  const todasRespondidas = total > 0 && respondidas === total

  if (ncCount !== null) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto mt-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-2">Checklist finalizado!</h2>
          <p className="text-sm text-slate-500 mb-5">{exec.modelo_nome} concluído com sucesso.</p>

          {ncCount > 0 ? (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-left">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{ncCount} não conformidade{ncCount > 1 ? 's' : ''} gerada{ncCount > 1 ? 's' : ''}.</span>{' '}
                Acesse o módulo de NCs para acompanhar as tratativas.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5 justify-center">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <p className="text-sm text-emerald-800 font-medium">Todos os itens conformes!</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {ncCount > 0 && !isColaborador && (
              <button onClick={() => navigate('/nao-conformidades')} className="btn-primary w-full justify-center">
                <AlertTriangle size={15} /> Ver não conformidades
              </button>
            )}
            <button onClick={() => navigate('/meus-checklists')} className="btn-secondary w-full justify-center">
              <ListChecks size={15} /> Voltar para checklists <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-28">
      <button onClick={() => navigate('/meus-checklists')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
        <ArrowLeft size={16} /> Voltar
      </button>

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

      <div className="space-y-3">
        {respostas.map((r, i) => (
          <ItemCard
            key={r.id}
            r={r}
            index={i + 1}
            readOnly={readOnly}
            fotos={fotosMap[r.id] ?? []}
            onStatus={setStatus}
            onObs={setObservacao}
            onAddFoto={handleAddFoto}
            onDeleteFoto={handleDeleteFoto}
          />
        ))}
      </div>

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
  r, index, readOnly, fotos, onStatus, onObs, onAddFoto, onDeleteFoto,
}: {
  r: Resposta
  index: number
  readOnly: boolean
  fotos: RespostaFoto[]
  onStatus: (r: Resposta, s: StatusResposta) => void
  onObs: (r: Resposta, v: string) => void
  onAddFoto: (r: Resposta, file: File) => Promise<void>
  onDeleteFoto: (r: Resposta, id: string) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isNaoConforme = r.status === 'nao_conforme'
  const showFotoSection = r.exige_foto || isNaoConforme || fotos.length > 0

  async function handleFoto(file: File) {
    setUploading(true)
    try {
      await onAddFoto(r, file)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(fotoId: string) {
    setDeletingId(fotoId)
    try {
      await onDeleteFoto(r, fotoId)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={clsx(
      'card p-4 transition-colors',
      isNaoConforme && 'border-red-200 bg-red-50/30',
    )}>
      <div className="flex gap-3">
        <span className={clsx(
          'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5',
          isNaoConforme ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500',
        )}>{index}</span>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium', isNaoConforme ? 'text-red-900' : 'text-slate-800')}>{r.item_descricao}</p>

          {isNaoConforme && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
              <AlertTriangle size={12} /> NC será gerada automaticamente
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <StatusButton active={r.status === 'conforme'} onClick={() => onStatus(r, 'conforme')} disabled={readOnly} tone="emerald" icon={Check} label="Conforme" />
            <StatusButton active={r.status === 'nao_conforme'} onClick={() => onStatus(r, 'nao_conforme')} disabled={readOnly} tone="red" icon={X} label="Não conforme" />
            <StatusButton active={r.status === 'na'} onClick={() => onStatus(r, 'na')} disabled={readOnly} tone="slate" icon={MinusCircle} label="N/A" />
          </div>

          {/* Galeria de fotos */}
          {showFotoSection && (
            <div className="mt-3">
              {fotos.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {fotos.map((f) => (
                    <div key={f.id} className="relative group">
                      <img
                        src={f.url}
                        alt="evidência"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                      />
                      {!readOnly && (
                        <button
                          onClick={() => handleDelete(f.id)}
                          disabled={deletingId === f.id}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                        >
                          {deletingId === f.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Botão de adicionar mais fotos */}
                  {!readOnly && fotos.length < 5 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors disabled:opacity-60"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      <span className="text-[10px] mt-0.5">{uploading ? '...' : 'Foto'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Botão inicial quando não há fotos */}
              {fotos.length === 0 && !readOnly && (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className={clsx(
                    'flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2 transition-colors disabled:opacity-60',
                    isNaoConforme
                      ? 'text-red-700 bg-red-50 border border-red-200 hover:bg-red-100'
                      : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100',
                  )}
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                  {uploading ? 'Enviando...' : isNaoConforme ? 'Anexar evidência da falha' : 'Anexar foto de evidência'}
                </button>
              )}

              {fotos.length > 0 && (
                <p className="text-[11px] text-slate-400 mt-1">{fotos.length} foto{fotos.length > 1 ? 's' : ''} · máx. 5</p>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFoto(f); e.target.value = '' }}
              />
            </div>
          )}

          {!readOnly ? (
            <input
              className={clsx('input-field mt-3 text-sm', isNaoConforme && 'border-red-200 focus:ring-red-500/50 focus:border-red-400')}
              placeholder={isNaoConforme ? 'Descreva a falha observada (recomendado)' : 'Observação (opcional)'}
              defaultValue={r.observacao ?? ''}
              onBlur={(e) => { if (e.target.value !== (r.observacao ?? '')) onObs(r, e.target.value) }}
            />
          ) : (
            r.observacao && <p className="text-xs text-slate-500 mt-2 italic">"{r.observacao}"</p>
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
