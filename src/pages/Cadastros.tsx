import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Building2, Layers, Users, MapPin } from 'lucide-react'
import clsx from 'clsx'
import {
  getUnidades, insertUnidade, updateUnidade, deleteUnidade,
  getSetores, insertSetor, updateSetor, deleteSetor,
  getColaboradores, insertColaborador, updateColaborador, deleteColaborador,
} from '../lib/queries'
import type { Unidade, Setor, Colaborador, Papel } from '../types'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'

type Tab = 'unidades' | 'setores' | 'colaboradores'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'unidades', label: 'Empresa', icon: Building2 },
  { id: 'setores', label: 'Setores', icon: Layers },
  { id: 'colaboradores', label: 'Equipe', icon: Users },
]

interface Form {
  nome: string
  endereco: string
  email: string
  funcao: string
  papel: Papel
  unidade_id: string
}
const formVazio: Form = { nome: '', endereco: '', email: '', funcao: '', papel: 'colaborador', unidade_id: '' }

export default function Cadastros() {
  const [tab, setTab] = useState<Tab>('unidades')
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>({ ...formVazio })
  const [salvando, setSalvando] = useState(false)

  const unidadeMap = new Map(unidades.map((u) => [u.id, u.nome]))

  async function carregar() {
    setLoading(true)
    const [u, s, c] = await Promise.all([getUnidades(), getSetores(), getColaboradores()])
    setUnidades(u as Unidade[]); setSetores(s as Setor[]); setColaboradores(c as Colaborador[])
    setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  function abrirNovo() { setEditId(null); setForm({ ...formVazio }); setOpen(true) }
  function abrirEdicaoUnidade(u: Unidade) { setEditId(u.id); setForm({ ...formVazio, nome: u.nome, endereco: u.endereco ?? '' }); setOpen(true) }
  function abrirEdicaoSetor(s: Setor) { setEditId(s.id); setForm({ ...formVazio, nome: s.nome }); setOpen(true) }
  function abrirEdicaoColab(c: Colaborador) {
    setEditId(c.id)
    setForm({ ...formVazio, nome: c.nome, email: c.email ?? '', funcao: c.funcao ?? '', papel: c.papel, unidade_id: c.unidade_id ?? '' })
    setOpen(true)
  }

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    try {
      if (tab === 'unidades') {
        const p = { nome: form.nome.trim(), endereco: form.endereco.trim() || null }
        if (editId) await updateUnidade(editId, p); else await insertUnidade(p)
      } else if (tab === 'setores') {
        const p = { nome: form.nome.trim() }
        if (editId) await updateSetor(editId, p); else await insertSetor(p)
      } else {
        const p = {
          nome: form.nome.trim(), email: form.email.trim() || null, funcao: form.funcao.trim() || null,
          papel: form.papel, unidade_id: form.unidade_id || null,
        }
        if (editId) await updateColaborador(editId, p); else await insertColaborador(p)
      }
      setOpen(false)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Confirmar exclusão?')) return
    if (tab === 'unidades') await deleteUnidade(id)
    else if (tab === 'setores') await deleteSetor(id)
    else await deleteColaborador(id)
    await carregar()
  }

  const titulo = tab === 'unidades' ? 'Empresa' : tab === 'setores' ? 'Setor' : 'Colaborador'

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Cadastros</h1>
          <p className="text-sm text-slate-500">Unidades, setores e equipe da operação</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary"><Plus size={16} /> Novo</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Carregando...</p>
      ) : (
        <div className="card divide-y divide-slate-100">
          {tab === 'unidades' && unidades.map((u) => (
            <Row key={u.id} title={u.nome} subtitle={u.endereco ?? undefined} icon={Building2}
              onEdit={() => abrirEdicaoUnidade(u)} onDelete={() => excluir(u.id)} />
          ))}
          {tab === 'setores' && setores.map((s) => (
            <Row key={s.id} title={s.nome} icon={Layers}
              onEdit={() => abrirEdicaoSetor(s)} onDelete={() => excluir(s.id)} />
          ))}
          {tab === 'colaboradores' && colaboradores.map((c) => (
            <Row key={c.id} title={c.nome} subtitle={[c.funcao, c.unidade_id ? unidadeMap.get(c.unidade_id) : null].filter(Boolean).join(' · ') || undefined}
              icon={Users} badge={c.papel === 'gestor' ? 'Gestor' : undefined}
              onEdit={() => abrirEdicaoColab(c)} onDelete={() => excluir(c.id)} />
          ))}
          {((tab === 'unidades' && !unidades.length) || (tab === 'setores' && !setores.length) || (tab === 'colaboradores' && !colaboradores.length)) && (
            <p className="text-sm text-slate-400 p-8 text-center">Nada cadastrado ainda.</p>
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${editId ? 'Editar' : 'Novo'} · ${titulo}`}
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={salvar} disabled={salvando || !form.nome.trim()} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Nome</label>
            <input className="input-field" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder={`Nome ${titulo.toLowerCase()}`} />
          </div>

          {tab === 'unidades' && (
            <div>
              <label className="label-field">Endereço</label>
              <input className="input-field" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} placeholder="Endereço (opcional)" />
            </div>
          )}

          {tab === 'colaboradores' && (
            <>
              <div>
                <label className="label-field">E-mail</label>
                <input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Função</label>
                  <input className="input-field" value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })} placeholder="Ex.: Cozinha" />
                </div>
                <div>
                  <label className="label-field">Papel</label>
                  <select className="select-field" value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as Papel })}>
                    <option value="colaborador">Colaborador</option>
                    <option value="gestor">Gestor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label-field">Unidade</label>
                <select className="select-field" value={form.unidade_id} onChange={(e) => setForm({ ...form, unidade_id: e.target.value })}>
                  <option value="">—</option>
                  {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

function Row({
  title, subtitle, icon: Icon, badge, onEdit, onDelete,
}: {
  title: string
  subtitle?: string
  icon: React.ElementType
  badge?: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon size={16} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-800 truncate">{title}</p>
          {badge && <Badge variant="emerald">{badge}</Badge>}
        </div>
        {subtitle && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {subtitle}</p>}
      </div>
      <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={15} /></button>
      <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
    </div>
  )
}
