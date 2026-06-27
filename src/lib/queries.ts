import { supabase } from './supabase'
import type { Execucao, ModeloItem, Resposta, RespostaFoto, NaoConformidade, StatusNC, CriticidadeNC } from '../types'

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

// ── Múltiplas fotos por resposta ──────────────────────────
export async function getFotosPorRespostas(respostaIds: string[]): Promise<Record<string, RespostaFoto[]>> {
  if (!respostaIds.length) return {}
  const { data, error } = await supabase
    .from('mc_respostas_fotos')
    .select('*')
    .in('resposta_id', respostaIds)
    .order('criado_em', { ascending: true })
  if (error) throw error
  const map: Record<string, RespostaFoto[]> = {}
  for (const f of (data ?? []) as RespostaFoto[]) {
    if (!map[f.resposta_id]) map[f.resposta_id] = []
    map[f.resposta_id].push(f)
  }
  return map
}

export async function addFotoResposta(respostaId: string, url: string): Promise<RespostaFoto> {
  const { data, error } = await supabase
    .from('mc_respostas_fotos')
    .insert({ resposta_id: respostaId, url })
    .select()
    .single()
  if (error) throw error
  return data as RespostaFoto
}

export async function deleteFotoResposta(id: string): Promise<void> {
  const { error } = await supabase.from('mc_respostas_fotos').delete().eq('id', id)
  if (error) throw error
}

/** Cria uma execução avulsa (fora do cron) para hoje. */
export async function criarExecucaoAvulsa(payload: {
  modelo_id: string
  responsavel_id?: string | null
  horario?: string | null
}): Promise<Execucao> {
  const [{ data: modelo }, { data: respColab }] = await Promise.all([
    supabase.from('mc_modelos').select('*').eq('id', payload.modelo_id).single(),
    payload.responsavel_id
      ? supabase.from('mc_colaboradores').select('nome').eq('id', payload.responsavel_id).single()
      : Promise.resolve({ data: null }),
  ])

  let setor_nome: string | null = null
  if (modelo?.setor_id) {
    const { data: setor } = await supabase.from('mc_setores').select('nome').eq('id', modelo.setor_id).single()
    setor_nome = setor?.nome ?? null
  }

  const hoje = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('mc_execucoes')
    .insert({
      modelo_id: payload.modelo_id,
      modelo_nome: modelo?.nome ?? '',
      setor_id: modelo?.setor_id ?? null,
      setor_nome,
      responsavel_id: payload.responsavel_id ?? null,
      responsavel_nome: (respColab as { nome?: string } | null)?.nome ?? null,
      data: hoje,
      horario_previsto: payload.horario ?? null,
      status: 'nao_iniciado',
      percentual: 0,
      total_itens: 0,
      itens_conformes: 0,
    })
    .select()
    .single()
  if (error) throw error
  return data as Execucao
}

// ════════════════════════════════════════════════════════════
//  Não Conformidades
// ════════════════════════════════════════════════════════════

export interface NcFiltros {
  inicio?: string
  fim?: string
  status?: StatusNC
  criticidade?: CriticidadeNC
  setor_id?: string
  responsavel_id?: string
}

export async function getNaoConformidades(f: NcFiltros = {}): Promise<NaoConformidade[]> {
  let q = supabase.from('mc_nao_conformidades').select('*').order('criado_em', { ascending: false })
  if (f.inicio) q = q.gte('data_abertura', f.inicio)
  if (f.fim) q = q.lte('data_abertura', f.fim)
  if (f.status) q = q.eq('status', f.status)
  if (f.criticidade) q = q.eq('criticidade', f.criticidade)
  if (f.setor_id) q = q.eq('setor_id', f.setor_id)
  if (f.responsavel_id) q = q.eq('responsavel_id', f.responsavel_id)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as NaoConformidade[]
}

export async function getNaoConformidade(id: string): Promise<NaoConformidade> {
  const { data, error } = await supabase.from('mc_nao_conformidades').select('*').eq('id', id).single()
  if (error) throw error
  return data as NaoConformidade
}

export async function updateNaoConformidade(id: string, payload: Partial<NaoConformidade>) {
  const { data, error } = await supabase.from('mc_nao_conformidades').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

/** Gera NC automaticamente ao marcar resposta como não conforme. Idempotente. */
export async function gerarNcSeNaoConforme(r: Resposta, exec: Execucao): Promise<void> {
  if (!r.id) return
  const { data: existing } = await supabase
    .from('mc_nao_conformidades')
    .select('id')
    .eq('resposta_id', r.id)
    .maybeSingle()
  if (existing) return

  const prazo = new Date()
  prazo.setDate(prazo.getDate() + 3)

  const { error } = await supabase.from('mc_nao_conformidades').insert({
    execucao_id: exec.id,
    resposta_id: r.id,
    modelo_id: exec.modelo_id ?? null,
    modelo_nome: exec.modelo_nome,
    item_id: r.item_id ?? null,
    item_descricao: r.item_descricao,
    unidade_id: exec.unidade_id ?? null,
    setor_id: exec.setor_id ?? null,
    setor_nome: exec.setor_nome ?? null,
    responsavel_id: exec.responsavel_id ?? null,
    responsavel_nome: exec.responsavel_nome ?? null,
    titulo: r.item_descricao,
    descricao: r.observacao ?? null,
    observacao: r.observacao ?? null,
    foto_url: r.foto_url ?? null,
    status: 'aberta',
    criticidade: 'media',
    data_abertura: exec.data,
    prazo_correcao: prazo.toISOString().slice(0, 10),
  })
  if (error && !error.message.includes('uq_mc_nc_resposta')) throw error
}

export interface NcStats {
  total: number
  abertas: number
  emAndamento: number
  vencidas: number
  concluidas: number
  canceladas: number
  criticas: number
  porStatus: { status: string; label: string; count: number }[]
  porSetor: { nome: string; count: number }[]
  topItens: { descricao: string; count: number }[]
}

export async function getNcStats(f: DashboardFiltros): Promise<NcStats> {
  let q = supabase.from('mc_nao_conformidades').select('*')
    .gte('data_abertura', f.inicio)
    .lte('data_abertura', f.fim)
  if (f.setor_id) q = q.eq('setor_id', f.setor_id)
  if (f.responsavel_id) q = q.eq('responsavel_id', f.responsavel_id)
  const { data, error } = await q
  if (error) throw error
  const ncs = (data ?? []) as NaoConformidade[]

  const hoje = new Date().toISOString().slice(0, 10)
  const labels: Record<string, string> = {
    aberta: 'Aberta', em_andamento: 'Em andamento',
    vencida: 'Vencida', concluida: 'Concluída', cancelada: 'Cancelada',
  }

  const groupStatus: Record<string, number> = {}
  const groupSetor: Record<string, number> = {}
  const groupItem: Record<string, number> = {}

  let abertas = 0, emAndamento = 0, vencidas = 0, concluidas = 0, canceladas = 0, criticas = 0

  for (const n of ncs) {
    groupStatus[n.status] = (groupStatus[n.status] ?? 0) + 1
    if (n.setor_nome) groupSetor[n.setor_nome] = (groupSetor[n.setor_nome] ?? 0) + 1
    if (n.item_descricao) groupItem[n.item_descricao] = (groupItem[n.item_descricao] ?? 0) + 1
    if (n.status === 'aberta') abertas++
    if (n.status === 'em_andamento') emAndamento++
    if (n.status === 'vencida' || (n.status === 'aberta' && n.prazo_correcao && n.prazo_correcao < hoje)) vencidas++
    if (n.status === 'concluida') concluidas++
    if (n.status === 'cancelada') canceladas++
    if (n.criticidade === 'critica' || n.criticidade === 'alta') criticas++
  }

  return {
    total: ncs.length,
    abertas,
    emAndamento,
    vencidas,
    concluidas,
    canceladas,
    criticas,
    porStatus: Object.entries(groupStatus).map(([status, count]) => ({ status, label: labels[status] ?? status, count })),
    porSetor: Object.entries(groupSetor).map(([nome, count]) => ({ nome, count })).sort((a, b) => b.count - a.count),
    topItens: Object.entries(groupItem).map(([descricao, count]) => ({ descricao, count })).sort((a, b) => b.count - a.count).slice(0, 5),
  }
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

function turnoDe(e: Execucao): string | null {
  if (!e.horario_previsto) return null
  const h = parseInt(e.horario_previsto.slice(0, 2), 10)
  if (Number.isNaN(h)) return null
  return h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite'
}

export interface DashboardData {
  metricas: Metricas
  rankingUsuarios: RankingItem[]
  rankingSetores: RankingItem[]
  rankingTurnos: RankingItem[]
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
    rankingSetores: ranking(execs, (e) => e.setor_nome),
    rankingTurnos: ranking(execs, turnoDe),
    evolucao,
  }
}
