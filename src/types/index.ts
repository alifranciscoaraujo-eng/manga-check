// ── Tipos do Manga Check ───────────────────────────────────
export type Papel = 'gestor' | 'colaborador'
export type Turno = 'manha' | 'tarde' | 'noite'
export type Recorrencia = 'diaria' | 'semanal' | 'mensal'
export type StatusExecucao = 'nao_iniciado' | 'em_andamento' | 'finalizado' | 'atrasado'
export type StatusResposta = 'conforme' | 'nao_conforme' | 'na'

export interface Unidade {
  id: string
  nome: string
  endereco?: string | null
  ativo: boolean
  created_at?: string
}

export interface Setor {
  id: string
  nome: string
  ativo: boolean
  created_at?: string
}

export interface Colaborador {
  id: string
  user_id?: string | null
  nome: string
  email?: string | null
  funcao?: string | null
  papel: Papel
  unidade_id?: string | null
  ativo: boolean
  created_at?: string
}

export interface Modelo {
  id: string
  nome: string
  descricao?: string | null
  setor_id?: string | null
  ativo: boolean
  created_at?: string
}

export interface ModeloItem {
  id: string
  modelo_id: string
  ordem: number
  descricao: string
  exige_foto: boolean
  obrigatorio: boolean
}

export interface Agendamento {
  id: string
  modelo_id: string
  unidade_id?: string | null
  setor_id?: string | null
  responsavel_id?: string | null
  turno?: Turno | null
  horario: string
  recorrencia: Recorrencia
  dias_semana: number[]
  ativo: boolean
  created_at?: string
}

export interface Execucao {
  id: string
  agendamento_id?: string | null
  modelo_id?: string | null
  modelo_nome: string
  unidade_id?: string | null
  unidade_nome?: string | null
  setor_id?: string | null
  setor_nome?: string | null
  responsavel_id?: string | null
  responsavel_nome?: string | null
  data: string
  horario_previsto?: string | null
  status: StatusExecucao
  percentual: number
  total_itens: number
  itens_conformes: number
  iniciado_em?: string | null
  finalizado_em?: string | null
  no_prazo?: boolean | null
  observacoes?: string | null
  created_at?: string
}

export interface Resposta {
  id: string
  execucao_id: string
  item_id?: string | null
  item_descricao: string
  ordem: number
  exige_foto: boolean
  status?: StatusResposta | null
  observacao?: string | null
  foto_url?: string | null
  respondido_em?: string | null
}
