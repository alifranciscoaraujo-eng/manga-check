import { supabase } from './supabase'
import type { Execucao, ModeloItem, Resposta } from '../types'

// ════════════════════════════════════════════════════════════
//  Cadastros básicos
// ════════════════════════════════════════════════════════════
export async function getUnidades() {
  const { data, error } = await supabase.from('mc_unidades').select('*').order('nome')
  if (error) throw error
  return data ?? []
}
export async function insertUnidade(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_unidades').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateUnidade(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_unidades').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteUnidade(id: string) {
  const { error } = await supabase.from('mc_unidades').delete().eq('id', id)
  if (error) throw error
}

export async function getSetores() {
  const { data, error } = await supabase.from('mc_setores').select('*').order('nome')
  if (error) throw error
  return data ?? []
}
export async function insertSetor(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_setores').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateSetor(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_setores').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteSetor(id: string) {
  const { error } = await supabase.from('mc_setores').delete().eq('id', id)
  if (error) throw error
}

export async function getColaboradores() {
  const { data, error } = await supabase.from('mc_colaboradores').select('*').order('nome')
  if (error) throw error
  return data ?? []
}
export async function insertColaborador(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_colaboradores').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateColaborador(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_colaboradores').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteColaborador(id: string) {
  const { error } = await supabase.from('mc_colaboradores').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
//  Modelos de checklist
// ════════════════════════════════════════════════════════════
export async function getModelos() {
  const { data, error } = await supabase.from('mc_modelos').select('*').order('nome')
  if (error) throw error
  return data ?? []
}
export async function insertModelo(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_modelos').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateModelo(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_modelos').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteModelo(id: string) {
  const { error } = await supabase.from('mc_modelos').delete().eq('id', id)
  if (error) throw error
}

export async function getItensModelo(modeloId: string): Promise<ModeloItem[]> {
  const { data, error } = await supabase.from('mc_modelo_itens').select('*').eq('modelo_id', modeloId).order('ordem')
  if (error) throw error
  return (data ?? []) as ModeloItem[]
}
export async function insertItemModelo(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_modelo_itens').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateItemModelo(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_modelo_itens').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteItemModelo(id: string) {
  const { error } = await supabase.from('mc_modelo_itens').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
//  Agendamentos
// ════════════════════════════════════════════════════════════
export async function getAgendamentos() {
  const { data, error } = await supabase.from('mc_agendamentos').select('*').order('horario')
  if (error) throw error
  return data ?? []
}
export async function insertAgendamento(payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_agendamentos').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateAgendamento(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_agendamentos').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteAgendamento(id: string) {
  const { error } = await supabase.from('mc_agendamentos').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
//  Execuções
// ════════════════════════════════════════════════════════════
export async function getExecucoesHoje(): Promise<Execucao[]> {
  const hoje = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('mc_execucoes')
    .select('*')
    .eq('data', hoje)
    .order('horario_previsto', { ascending: true })
  if (error) throw error
  return (data ?? []) as Execucao[]
}

export async function getExecucao(id: string): Promise<Execucao> {
  const { data, error } = await supabase.from('mc_execucoes').select('*').eq('id', id).single()
  if (error) throw error
  return data as Execucao
}

export async function updateExecucao(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_execucoes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function getRespostas(execucaoId: string): Promise<Resposta[]> {
  const { data, error } = await supabase.from('mc_respostas').select('*').eq('execucao_id', execucaoId).order('ordem')
  if (error) throw error
  return (data ?? []) as Resposta[]
}

export async function updateResposta(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.from('mc_respostas').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Cria as respostas (a partir dos itens do modelo) e marca a execução como em andamento. */
export async function iniciarExecucao(exec: Execucao): Promise<Resposta[]> {
  const existentes = await getRespostas(exec.id)
  if (existentes.length === 0 && exec.modelo_id) {
    const itens = await getItensModelo(exec.modelo_id)
    if (itens.length) {
      const payload = itens.map((it) => ({
        execucao_id: exec.id,
        item_id: it.id,
        item_descricao: it.descricao,
        ordem: it.ordem,
        exige_foto: it.exige_foto,
      }))
      // onConflict garante idempotência mesmo com chamadas concorrentes.
      const { error } = await supabase
        .from('mc_respostas')
        .upsert(payload, { onConflict: 'execucao_id,item_id', ignoreDuplicates: true })
      if (error) throw error
    }
  }
  if (exec.status === 'nao_iniciado' || exec.status === 'atrasado') {
    await updateExecucao(exec.id, {
      status: 'em_andamento',
      iniciado_em: exec.iniciado_em ?? new Date().toISOString(),
    })
  }
  return getRespostas(exec.id)
}

/** Recalcula progresso da execução a partir das respostas. */
export async function recalcularProgresso(execucaoId: string) {
  const respostas = await getRespostas(execucaoId)
  const total = respostas.length
  const respondidas = respostas.filter((r) => r.status).length
  const percentual = total ? Math.round((respondidas / total) * 100) : 0
  await updateExecucao(execucaoId, { percentual })
  return { total, respondidas, percentual }
}

/** Finaliza a execução, consolidando conformidade e pontualidade. */
export async function finalizarExecucao(exec: Execucao) {
  const respostas = await getRespostas(exec.id)
  const total = respostas.length
  const conformes = respostas.filter((r) => r.status === 'conforme').length
  const agora = new Date()
  // No prazo: finalizado até 30 min após o horário previsto.
  let noPrazo = true
  if (exec.horario_previsto) {
    const previsto = new Date(`${exec.data}T${exec.horario_previsto}`)
    noPrazo = agora.getTime() <= previsto.getTime() + 30 * 60 * 1000
  }
  await updateExecucao(exec.id, {
    status: 'finalizado',
    percentual: 100,
    total_itens: total,
    itens_conformes: conformes,
    finalizado_em: agora.toISOString(),
    no_prazo: noPrazo,
  })
}

// ── Upload de evidência fotográfica ────────────────────────
export async function uploadEvidencia(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `respostas/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('mc-evidencias').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('mc-evidencias').getPublicUrl(path)
  return data.publicUrl
}

// ════════════════════════════════════════════════════════════
//  Dashboard / indicadores
// ════════════════════════════════════════════════════════════
export interface Metricas {
  total: number
  finalizados: number
  naoIniciado: number
  emAndamento: number
  atrasado: number
  conclusao: number
  pontualidade: number
  qualidade: number
  esforco: number
  score: number
}

export interface RankingItem {
  nome: string
  score: number
  pontualidade: number
  qualidade: number
  total: number
  finalizados: number
}

export interface DashboardFiltros {
  inicio: string
  fim: string
  unidade_id?: string
  setor_id?: string
  responsavel_id?: string
}

function aggregate(execs: Execucao[]): Metricas {
  const total = execs.length
  const finalizados = execs.filter((e) => e.status === 'finalizado')
  const emAndamento = execs.filter((e) => e.status === 'em_andamento').length
  const naoIniciado = execs.filter((e) => e.status === 'nao_iniciado').length
  const atrasado = execs.filter((e) => e.status === 'atrasado').length
  const nFin = finalizados.length
  const noPrazo = finalizados.filter((e) => e.no_prazo).length
  const somaItens = finalizados.reduce((a, e) => a + (e.total_itens || 0), 0)
  const somaConf = finalizados.reduce((a, e) => a + (e.itens_conformes || 0), 0)
  const conclusao = total ? (nFin / total) * 100 : 0
  const pontualidade = nFin ? (noPrazo / nFin) * 100 : 0
  const qualidade = somaItens ? (somaConf / somaItens) * 100 : 0
  const esforco = total ? ((nFin + emAndamento) / total) * 100 : 0
  const score = pontualidade * 0.4 + qualidade * 0.4 + conclusao * 0.2
  return { total, finalizados: nFin, naoIniciado, emAndamento, atrasado, conclusao, pontualidade, qualidade, esforco, score }
}

function ranking(execs: Execucao[], key: (e: Execucao) => string | null | undefined): RankingItem[] {
  const grupos = new Map<string, Execucao[]>()
  for (const e of execs) {
    const k = key(e)
    if (!k) continue
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k)!.push(e)
  }
  return [...grupos.entries()]
    .map(([nome, lista]) => {
      const m = aggregate(lista)
      return { nome, score: m.score, pontualidade: m.pontualidade, qualidade: m.qualidade, total: m.total, finalizados: m.finalizados }
    })
    .sort((a, b) => b.score - a.score)
}

export interface DashboardData {
  metricas: Metricas
  rankingUsuarios: RankingItem[]
  rankingUnidades: RankingItem[]
  rankingSetores: RankingItem[]
  evolucao: { data: string; score: number; pontualidade: number; qualidade: number; esforco: number }[]
}

export async function getDashboardData(f: DashboardFiltros): Promise<DashboardData> {
  let query = supabase.from('mc_execucoes').select('*').gte('data', f.inicio).lte('data', f.fim)
  if (f.unidade_id) query = query.eq('unidade_id', f.unidade_id)
  if (f.setor_id) query = query.eq('setor_id', f.setor_id)
  if (f.responsavel_id) query = query.eq('responsavel_id', f.responsavel_id)
  const { data, error } = await query
  if (error) throw error
  const execs = (data ?? []) as Execucao[]

  // Evolução por dia
  const porDia = new Map<string, Execucao[]>()
  for (const e of execs) {
    if (!porDia.has(e.data)) porDia.set(e.data, [])
    porDia.get(e.data)!.push(e)
  }
  const evolucao = [...porDia.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dia, lista]) => {
      const m = aggregate(lista)
      return { data: dia, score: Math.round(m.score), pontualidade: Math.round(m.pontualidade), qualidade: Math.round(m.qualidade), esforco: Math.round(m.esforco) }
    })

  return {
    metricas: aggregate(execs),
    rankingUsuarios: ranking(execs, (e) => e.responsavel_nome),
    rankingUnidades: ranking(execs, (e) => e.unidade_nome),
    rankingSetores: ranking(execs, (e) => e.setor_nome),
    evolucao,
  }
}
