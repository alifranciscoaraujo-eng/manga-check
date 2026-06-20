import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import clsx from 'clsx'
import {
  getAgendamentos, insertAgendamento, updateAgendamento, deleteAgendamento,
  getModelos, getUnidades, getSetores, getColaboradores,
} from '../lib/queries'
import type { Agendamento, Modelo, Unidade, Setor, Colaborador, Turno, Recorrencia } from '../types'
import { hhmm, diasResumo, turnoLabel, recorrenciaLabel, DIAS_SEMANA } from '../lib/format'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'

const vazio = {
  modelo_id: '', unidade_id: '', setor_id: '', responsavel_id: '',
  turno: 'manha' as Turno, horario: '08:00', recorrencia: 'diaria' as Recorrencia,
  dias_semana: [1, 2, 3, 4, 5] as number[],
}

export default function Agendamentos() {
  const [ags, setAgs] = useState<Agendamento[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Agendamento | null>(null)
  const [form, setForm] = useState({ ...vazio })
  const [salvando, setSalvando] = useState(false)

  const modeloMap = new Map(modelos.map((m) => [m.id, m.nome]))
  const unidadeMap = new Map(unidades.map((u) => [u.id, u.nome]))
  const setorMap = new Map(setores.map((s) => [s.id, s.nome]))
  const colabMap = new Map(colaboradores.map((c) => [c.id, c.nome]))

  async function carregar() {
    setLoading(true)
    const [a, m, u, s, c] = await Promise.all([
      getAgendamentos(), getModelos(), getUnidades(), getSetores(), getColaboradores(),
    ])
    setAgs(a as Agendamento[]); setModelos(m as Modelo[]); setUnidades(u as Unidade[])
    setSetores(s as Setor[]); setColaboradores(c as Colaborador[])
    setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  function abrirNovo() { setEditando(null); setForm({ ...vazio }); setOpen(true) }
  function abrirEdicao(a: Agendamento) {
    setEditando(a)
    setForm({
      modelo_id: a.modelo_id, unidade_id: a.unidade_id ?? '', setor_id: a.setor_id ?? '',
      responsavel_id: a.responsavel_id ?? '', turno: (a.turno ?? 'manha') as Turno,
      horario: hhmm(a.horario), recorrencia: a.recorrencia, dias_semana: a.dias_semana ?? [],
    })
    setOpen(true)
  }

  function toggleDia(d: number) {
    setForm((f) => ({
      ...f,
      dias_semana: f.dias_semana.includes(d) ? f.dias_semana.filter((x) => x !== d) : [...f.dias_semana, d].sort((a, b) => a - b),
    }))
  }

  async function salvar() {
    if (!form.modelo_id) return
    setSalvando(true)
    try {
      const payload = {
        modelo_id: form.modelo_id,
        unidade_id: form.unidade_id || null,
        setor_id: form.setor_id || null,
        responsavel_id: form.responsavel_id || null,
        turno: form.turno,
        horario: form.horario,
        recorrencia: form.recorrencia,
        dias_semana: form.dias_semana,
      }
      if (editando) await updateAgendamento(editando.id, payload)
      else await insertAgendamento(payload)
      setOpen(false)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(a: Agendamento) {
    if (!confirm('Excluir este agendamento?')) return
    await deleteAgendamento(a.id)
    await carregar()
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Agendamentos</h1>
          <p className="text-sm text-slate-500">Defina quando cada rotina aparece para a equipe</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary"><Plus size={16} /> Novo agendamento</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Carregando...</p>
      ) : ags.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Nenhum agendamento cadastrado.</div>
      ) : (
        <div className="space-y-3">
          {ags.map((a) => (
            <div key={a.id} className="card p-4 flex items-center gap-4">
              <div className="w-12 text-center shrink-0">
                <p className="text-base font-extrabold text-slate-800 leading-none flex items-center justify-center gap-1">
                  <Clock size={13} className="text-emerald-600" />{hhmm(a.horario)}
                </p>
                {a.turno && <p className="text-[11px] text-slate-400 mt-1">{turnoLabel[a.turno]}</p>}
              </div>
              <div className="w-px self-stretch bg-slate-100" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{modeloMap.get(a.modelo_id) ?? 'Modelo'}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                  {a.unidade_id && <span>{unidadeMap.get(a.unidade_id)}</span>}
                  {a.setor_id && <span>· {setorMap.get(a.setor_id)}</span>}
                  {a.responsavel_id && <span>· {colabMap.get(a.responsavel_id)}</span>}
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <Badge variant="emerald">{recorrenciaLabel[a.recorrencia]}</Badge>
                <span className="text-[11px] text-slate-400">{diasResumo(a.dias_semana)}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => abrirEdicao(a)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                <button onClick={() => excluir(a)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editando ? 'Editar agendamento' : 'Novo agendamento'}
        maxWidth="max-w-xl"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={salvar} disabled={salvando || !form.modelo_id} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Modelo de checklist</label>
            <select className="select-field" value={form.modelo_id} onChange={(e) => setForm({ ...form, modelo_id: e.target.value })}>
              <option value="">Selecione...</option>
              {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Unidade</label>
              <select className="select-field" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })}>
                <option value="">—</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Setor</label>
              <select className="select-field" value={form.setor_id} onChange={(e) => setForm({ ...form, setor_id: e.target.value })}>
                <option value="">—</option>
                {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Responsável</label>
              <select className="select-field" value={form.responsavel_id} onChange={(e) => setForm({ ...form, responsavel_id: e.target.value })}>
                <option value="">—</option>
                {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label-field">Turno</label>
              <select className="select-field" value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value as Turno })}>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Horário</label>
              <input type="time" className="input-field" value={form.horario} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
            </div>
            <div>
              <label className="label-field">Recorrência</label>
              <select className="select-field" value={form.recorrencia} onChange={(e) => setForm({ ...form, recorrencia: e.target.value as Recorrencia })}>
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Dias da semana</label>
            <div className="flex gap-1.5">
              {DIAS_SEMANA.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDia(i)}
                  className={clsx(
                    'w-9 h-9 rounded-lg text-xs font-semibold transition-colors',
                    form.dias_semana.includes(i) ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {d[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
