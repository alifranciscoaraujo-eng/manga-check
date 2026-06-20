import { useEffect, useState } from 'react'
import { Plus, FileText, Pencil, Trash2, ListChecks, Camera, X, GripVertical } from 'lucide-react'
import {
  getModelos, insertModelo, updateModelo, deleteModelo,
  getSetores, getItensModelo, insertItemModelo, updateItemModelo, deleteItemModelo,
} from '../lib/queries'
import type { Modelo, Setor, ModeloItem } from '../types'
import Modal from '../components/UI/Modal'
import Badge from '../components/UI/Badge'

export default function Modelos() {
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)

  // modal de modelo
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Modelo | null>(null)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [setorId, setSetorId] = useState('')
  const [salvando, setSalvando] = useState(false)

  // modal de itens
  const [itensOpen, setItensOpen] = useState(false)
  const [modeloItens, setModeloItens] = useState<Modelo | null>(null)
  const [itens, setItens] = useState<ModeloItem[]>([])
  const [novoItem, setNovoItem] = useState('')
  const [novoFoto, setNovoFoto] = useState(false)

  const setorMap = new Map(setores.map((s) => [s.id, s.nome]))

  async function carregar() {
    setLoading(true)
    const [m, s] = await Promise.all([getModelos(), getSetores()])
    setModelos(m as Modelo[])
    setSetores(s as Setor[])
    setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  function abrirNovo() {
    setEditando(null); setNome(''); setDescricao(''); setSetorId(''); setModalOpen(true)
  }
  function abrirEdicao(m: Modelo) {
    setEditando(m); setNome(m.nome); setDescricao(m.descricao ?? ''); setSetorId(m.setor_id ?? ''); setModalOpen(true)
  }

  async function salvar() {
    if (!nome.trim()) return
    setSalvando(true)
    try {
      const payload = { nome: nome.trim(), descricao: descricao.trim() || null, setor_id: setorId || null }
      if (editando) await updateModelo(editando.id, payload)
      else await insertModelo(payload)
      setModalOpen(false)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(m: Modelo) {
    if (!confirm(`Excluir o modelo "${m.nome}"? Os itens também serão removidos.`)) return
    await deleteModelo(m.id)
    await carregar()
  }

  async function abrirItens(m: Modelo) {
    setModeloItens(m)
    setItens(await getItensModelo(m.id))
    setNovoItem(''); setNovoFoto(false)
    setItensOpen(true)
  }
  async function addItem() {
    if (!novoItem.trim() || !modeloItens) return
    const ordem = (itens[itens.length - 1]?.ordem ?? 0) + 1
    await insertItemModelo({ modelo_id: modeloItens.id, ordem, descricao: novoItem.trim(), exige_foto: novoFoto })
    setItens(await getItensModelo(modeloItens.id))
    setNovoItem(''); setNovoFoto(false)
    await carregar()
  }
  async function toggleFoto(it: ModeloItem) {
    await updateItemModelo(it.id, { exige_foto: !it.exige_foto })
    if (modeloItens) setItens(await getItensModelo(modeloItens.id))
  }
  async function removerItem(it: ModeloItem) {
    await deleteItemModelo(it.id)
    if (modeloItens) setItens(await getItensModelo(modeloItens.id))
    await carregar()
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">Modelos de Checklist</h1>
          <p className="text-sm text-slate-500">Padronize as rotinas que a equipe executa</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary"><Plus size={16} /> Novo modelo</button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Carregando...</p>
      ) : modelos.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">Nenhum modelo cadastrado ainda.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelos.map((m) => (
            <div key={m.id} className="card p-4 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 leading-tight truncate">{m.nome}</p>
                  {m.setor_id && <Badge variant="slate" className="mt-1">{setorMap.get(m.setor_id) ?? 'Setor'}</Badge>}
                </div>
              </div>
              {m.descricao && <p className="text-xs text-slate-500 mt-3 line-clamp-2">{m.descricao}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => abrirItens(m)} className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                  <ListChecks size={15} /> Itens
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirEdicao(m)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => excluir(m)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal modelo */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar modelo' : 'Novo modelo'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button onClick={salvar} disabled={salvando || !nome.trim()} className="btn-primary">{salvando ? 'Salvando...' : 'Salvar'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Nome do modelo</label>
            <input className="input-field" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Abertura de Cozinha" />
          </div>
          <div>
            <label className="label-field">Setor</label>
            <select className="select-field" value={setorId} onChange={(e) => setSetorId(e.target.value)}>
              <option value="">Sem setor</option>
              {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Descrição</label>
            <textarea className="input-field" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Para que serve este checklist" />
          </div>
        </div>
      </Modal>

      {/* Modal itens */}
      <Modal open={itensOpen} onClose={() => setItensOpen(false)} title={`Itens · ${modeloItens?.nome ?? ''}`} maxWidth="max-w-xl">
        <div className="space-y-2 mb-4">
          {itens.length === 0 && <p className="text-sm text-slate-400">Nenhum item. Adicione o primeiro abaixo.</p>}
          {itens.map((it, i) => (
            <div key={it.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <GripVertical size={14} className="text-slate-300 shrink-0" />
              <span className="w-5 text-xs font-bold text-slate-400 text-center">{i + 1}</span>
              <span className="flex-1 text-sm text-slate-700">{it.descricao}</span>
              <button
                onClick={() => toggleFoto(it)}
                title="Exigir foto"
                className={`p-1.5 rounded-lg transition-colors ${it.exige_foto ? 'bg-emerald-100 text-emerald-700' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
              >
                <Camera size={14} />
              </button>
              <button onClick={() => removerItem(it)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-4">
          <label className="label-field">Novo item</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input-field"
              value={novoItem}
              onChange={(e) => setNovoItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
              placeholder="Descreva a tarefa do item"
            />
            <button onClick={addItem} disabled={!novoItem.trim()} className="btn-primary shrink-0"><Plus size={16} /> Adicionar</button>
          </div>
          <label className="flex items-center gap-2 mt-2.5 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={novoFoto} onChange={(e) => setNovoFoto(e.target.checked)} className="accent-emerald-600" />
            <Camera size={14} className="text-slate-400" /> Exigir foto de evidência neste item
          </label>
        </div>
      </Modal>
    </div>
  )
}
