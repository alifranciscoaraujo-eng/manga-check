import { CheckCircle2, Clock, PlayCircle, AlertTriangle } from 'lucide-react'
import type { StatusExecucao } from '../../types'
import { statusLabel } from '../../lib/format'
import Badge from './Badge'

const map: Record<StatusExecucao, { variant: 'emerald' | 'amber' | 'red' | 'slate' | 'blue'; icon: React.ElementType }> = {
  finalizado: { variant: 'emerald', icon: CheckCircle2 },
  em_andamento: { variant: 'blue', icon: PlayCircle },
  atrasado: { variant: 'red', icon: AlertTriangle },
  nao_iniciado: { variant: 'slate', icon: Clock },
}

export default function StatusBadge({ status }: { status: StatusExecucao }) {
  const cfg = map[status]
  const Icon = cfg.icon
  return (
    <Badge variant={cfg.variant}>
      <Icon size={12} />
      {statusLabel[status]}
    </Badge>
  )
}
