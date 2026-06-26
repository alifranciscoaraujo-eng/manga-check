import type { StatusExecucao, Turno, Recorrencia } from '../types'

export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export const statusLabel: Record<StatusExecucao, string> = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  atrasado: 'Atrasado',
}

export const turnoLabel: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

export const recorrenciaLabel: Record<Recorrencia, string> = {
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
}

/** Formata "HH:MM:SS" -> "HH:MM" */
export function hhmm(time?: string | null): string {
  if (!time) return '--:--'
  return time.slice(0, 5)
}

export function diasResumo(dias: number[]): string {
  if (!dias?.length) return '—'
  const sorted = [...dias].sort((a, b) => a - b)
  if (sorted.length === 7) return 'Todos os dias'
  if (sorted.join(',') === '1,2,3,4,5') return 'Seg a Sex'
  if (sorted.join(',') === '1,2,3,4,5,6') return 'Seg a Sáb'
  return sorted.map((d) => DIAS_SEMANA[d]).join(', ')
}

export function pct(value: number): string {
  return `${Math.round(value)}%`
}

export function dataBR(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const ncStatusLabel: Record<string, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  vencida: 'Vencida',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const ncCriticidadeLabel: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export function iniciais(nome?: string | null): string {
  if (!nome) return '?'
  const parts = nome.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}
